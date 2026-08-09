/**
 * 契约守卫：用 OpenAPI schema 校验 Mock 的出入参。
 *
 * 存在的意义：Mock 与业务代码若由同一份「理解」写出，测试就是循环论证——
 * 断言的是 Mock 的返回，而 Mock 的返回本身可能违背契约。
 * 这里把 `apifox-import.json` 作为唯一裁判，任何编造的字段、写错的枚举、
 * 拼错的 multipart 字段名都会在测试阶段直接失败。
 *
 * 本文件不读文件系统，spec 由调用方注入，因此 H5 dev 构建不会打包契约 JSON。
 */
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { ValidateFunction } from 'ajv'

/** `GET /photos/{id}` 这样的操作键，与 handler 中声明的路径模板一致 */
type OperationKey = string

export interface ContractValidator {
  /** 校验响应体的 resp 字段；返回错误描述，通过时返回空串 */
  validateResponse: (op: OperationKey, resp: unknown, status?: number) => string
  /** 校验 multipart 请求的字段名集合 */
  validateMultipartFields: (op: OperationKey, fieldNames: string[]) => string
  /** 把实际请求的 method + pathname 匹配回契约里的操作键 */
  matchOperation: (method: string, pathname: string) => OperationKey | null
}

type Json = Record<string, any>

/**
 * OpenAPI 3.0 的 `nullable: true` 不是 JSON Schema 关键字，ajv 会忽略它，
 * 导致契约里允许为 null 的字段（如 reject_reason / exchange_at）被误判。
 * 这里统一转换成 `type: [原类型, 'null']`。
 */
function toJsonSchema(node: any): any {
  if (Array.isArray(node)) {
    return node.map(toJsonSchema)
  }
  if (!node || typeof node !== 'object') {
    return node
  }

  const out: Json = {}
  for (const [key, value] of Object.entries(node)) {
    if (key === 'example' || key === 'examples' || key === 'discriminator') {
      continue
    }
    out[key] = toJsonSchema(value)
  }

  if (out.nullable === true) {
    delete out.nullable
    if (typeof out.type === 'string') {
      out.type = [out.type, 'null']
    }
    else if (out.$ref) {
      // $ref 与 null 并存时改写成 anyOf，避免 ajv 忽略同级关键字
      const ref = out.$ref
      delete out.$ref
      out.anyOf = [{ $ref: ref }, { type: 'null' }]
    }
  }

  return out
}

const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch'] as const

export function createContractValidator(spec: Json): ContractValidator {
  const ajv = new Ajv({ strict: false, allErrors: true, allowUnionTypes: true })
  addFormats(ajv)

  const components = toJsonSchema(spec.components ?? {})
  const responseValidators = new Map<string, ValidateFunction>()
  const multipartFields = new Map<OperationKey, { all: Set<string>, required: Set<string> }>()
  /** 路径模板 → 匹配正则，用于把真实 URL 还原成操作键 */
  const routeMatchers: Array<{ method: string, template: string, re: RegExp, depth: number }> = []

  for (const [pathTemplate, pathItem] of Object.entries(spec.paths ?? {}) as [string, Json][]) {
    for (const method of HTTP_METHODS) {
      const op = pathItem[method]
      if (!op) {
        continue
      }

      const key: OperationKey = `${method.toUpperCase()} ${pathTemplate}`

      // 0. 路由匹配器：{id} → 单段通配。静态段更多的模板优先，
      //    保证 /photos/user 不会被 /photos/{id} 抢走。
      routeMatchers.push({
        method: method.toUpperCase(),
        template: pathTemplate,
        re: new RegExp(`^${pathTemplate.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{[^}]+\}/g, '[^/]+')}$`),
        depth: pathTemplate.split('/').filter(seg => seg && !seg.startsWith('{')).length,
      })

      // 1. 响应体：只校验业务负载 resp，信封字段由 http 层保证
      for (const [status, response] of Object.entries(op.responses ?? {}) as [string, Json][]) {
        const schema = response?.content?.['application/json']?.schema
        if (!schema) {
          continue
        }
        const respSchema = extractRespSchema(toJsonSchema(schema))
        if (!respSchema) {
          continue
        }
        try {
          responseValidators.set(
            `${key}#${status}`,
            ajv.compile({ ...respSchema, components }),
          )
        }
        catch {
          // 个别响应 schema 无法编译时跳过，不阻塞其余校验
        }
      }

      // 2. multipart 字段名：卡住 image_file / avatar 这类写错的表单键
      const multipart = op.requestBody?.content?.['multipart/form-data']?.schema
      if (multipart?.properties) {
        multipartFields.set(key, {
          all: new Set(Object.keys(multipart.properties)),
          required: new Set<string>(multipart.required ?? []),
        })
      }
    }
  }

  /** 从统一信封里剥出 resp 的 schema */
  function extractRespSchema(schema: Json): Json | null {
    if (schema.properties?.resp) {
      return schema.properties.resp
    }
    if (Array.isArray(schema.allOf)) {
      for (const part of schema.allOf) {
        const found = extractRespSchema(part)
        if (found) {
          return found
        }
      }
    }
    return null
  }

  return {
    validateResponse(op, resp, status = 200) {
      const validate = responseValidators.get(`${op}#${status}`)
      if (!validate) {
        return `契约中不存在 ${op} 的 ${status} JSON 响应定义`
      }
      if (validate(resp)) {
        return ''
      }
      const detail = (validate.errors ?? [])
        .map(e => `${e.instancePath || '(root)'} ${e.message}`)
        .join('; ')
      return `${op} ${status} 响应不符合契约: ${detail}`
    },

    validateMultipartFields(op, fieldNames) {
      const spec = multipartFields.get(op)
      if (!spec) {
        return `契约中不存在 ${op} 的 multipart 请求定义`
      }
      const unknown = fieldNames.filter(name => !spec.all.has(name))
      if (unknown.length) {
        return `${op} 提交了契约未定义的表单字段: ${unknown.join(', ')}（契约字段: ${Array.from(spec.all).join(', ')}）`
      }
      const missing = Array.from(spec.required).filter(name => !fieldNames.includes(name))
      if (missing.length) {
        return `${op} 缺少必填表单字段: ${missing.join(', ')}`
      }
      return ''
    },

    matchOperation(method, pathname) {
      // 契约基础路径是 /api，Mock 与真实请求都带该前缀
      const path = pathname.replace(/^\/api(?=\/|$)/, '') || '/'
      const upper = method.toUpperCase()
      const hit = routeMatchers
        .filter(item => item.method === upper && item.re.test(path))
        .sort((a, b) => b.depth - a.depth)[0]
      return hit ? `${upper} ${hit.template}` : null
    },
  }
}
