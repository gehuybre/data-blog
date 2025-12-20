import { defineDocumentType, makeSource } from 'contentlayer/source-files'

export const Analysis = defineDocumentType(() => ({
  name: 'Analysis',
  filePathPattern: `**/*.mdx`,
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

export default makeSource({
  contentDirPath: 'analyses',
  documentTypes: [Analysis],
  disableImportAliasWarning: true,
})
