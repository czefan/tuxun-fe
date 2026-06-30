import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'strip-json-comments',
      enforce: 'pre',
      resolveId(source, importer) {
        if (source.includes('pages.json')) {
          if (source.endsWith('pages.json.js')) {
            return source
          }
          return this.resolve(source, importer, { skipSelf: true }).then((resolved) => {
            if (resolved) {
              return `${resolved.id}.js`
            }
            return null
          })
        }
        return null
      },
      load(id) {
        if (id.endsWith('pages.json.js')) {
          const filePath = id.slice(0, -3)
          const code = fs.readFileSync(filePath, 'utf-8')
          const cleaned = code.replace(/^\s*\/\/.*$/gm, '')
          const obj = JSON.parse(cleaned)
          let jsCode = ''
          for (const [key, value] of Object.entries(obj)) {
            jsCode += `export const ${key} = ${JSON.stringify(value)};\n`
          }
          jsCode += `export default ${JSON.stringify(obj)};`
          return jsCode
        }
        return null
      },
    },
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'src/uni_modules/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
      '@img': path.resolve(process.cwd(), 'src/static/images'),
    },
  },
})
