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
    sourceProvider: { type: 'string', required: false },
    sourceTitle: { type: 'string', required: false },
    sourceUrl: { type: 'string', required: false },
    sourcePublicationDate: { type: 'date', required: false },
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
