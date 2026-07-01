import process from 'node:process'
import { defineConfig } from 'openapi-ts-request'

const schemaPath = process.env.OPENAPI_SCHEMA_PATH || './openapi.json'
const generatedPath = './src/service/api/generated'

export default defineConfig([
  {
    describe: 'tuxun-openapi',
    schemaPath,
    serversPath: generatedPath,
    requestLibPath: `import request from '@/service/request/openapi';\nimport type { OpenApiRequestOptions } from '@/service/request/openapi';`,
    requestOptionsType: 'OpenApiRequestOptions',
    isGenReactQuery: false,
    reactQueryMode: 'vue',
    isGenJavaScript: false,
  },
])
