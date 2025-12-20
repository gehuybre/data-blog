import { defineDocumentType, makeSource } from 'contentlayer/source-files'

export const Analysis = defineDocumentType(() => ({
  name: 'Analysis',
  // Only pick the main analysis MDX files; ignore results JSON files
  filePathPattern: `**/content.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: true },
    summary: { type: 'string', required: true },
    tags: { type: 'list', of: { type: 'string' }, required: false },
    slug: { type: 'string', required: true },
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (post) => `/analyses/${post.slug}`,
    },
  },
}))

export const Result = defineDocumentType(() => ({
  name: 'Result',
  // Ingest result JSON files produced by analyses
  filePathPattern: `**/results/*.json`,
  contentType: 'data',
  computedFields: {
    // Number of top-level items or length of the first array found in the JSON
    itemCount: {
      type: 'number',
      resolve: (doc) => {
        try {
          const fs = require('fs')
          const data = JSON.parse(fs.readFileSync(doc._raw.sourceFilePath, 'utf8'))
          if (Array.isArray(data)) return data.length
          if (data && typeof data === 'object') {
            const firstArr = Object.values(data).find((v) => Array.isArray(v))
            if (firstArr) return firstArr.length
            return Object.keys(data).length
          }
          return 0
        } catch {
          return 0
        }
      },
    },
    // Column keys for tabular JSON content (keys of first object found)
    columns: {
      type: 'list',
      of: { type: 'string' },
      resolve: (doc) => {
        try {
          const fs = require('fs')
          const data = JSON.parse(fs.readFileSync(doc._raw.sourceFilePath, 'utf8'))
          if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') return Object.keys(data[0])
          if (data && typeof data === 'object') {
            const firstArr = Object.values(data).find((v) => Array.isArray(v))
            if (firstArr && firstArr.length > 0 && typeof firstArr[0] === 'object') return Object.keys(firstArr[0])
            const firstObj = Object.values(data).find((v) => v && typeof v === 'object')
            if (firstObj && typeof firstObj === 'object') return Object.keys(firstObj)
            return Object.keys(data)
          }
          return []
        } catch {
          return []
        }
      },
    },
  },
}))

export default makeSource({
  contentDirPath: 'analyses',
  documentTypes: [Analysis, Result],
  disableImportAliasWarning: true,
})
