import process from 'node:process'
import { defineConfig } from 'openapi-ts-request'

const schemaPath = process.env.OPENAPI_SCHEMA_PATH || './openapi.json'

export default defineConfig([
  {
    describe: 'tuxun-openapi',
    schemaPath,
    serversPath: './src/service',
    requestLibPath: `import request from '@/service/request/vue-query';\n import { OpenApiRequestOptions } from '@/service/request/types';`,
    requestOptionsType: 'OpenApiRequestOptions',
    isGenReactQuery: false,
    reactQueryMode: 'vue',
    isGenJavaScript: false,
  },
])
