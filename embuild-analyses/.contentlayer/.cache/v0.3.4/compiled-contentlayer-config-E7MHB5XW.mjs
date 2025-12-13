// contentlayer.config.ts
import { defineDocumentType, makeSource } from "contentlayer/source-files";
var Analysis = defineDocumentType(() => ({
  name: "Analysis",
  filePathPattern: `**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    summary: { type: "string", required: true },
    tags: { type: "list", of: { type: "string" }, required: false },
    slug: { type: "string", required: true }
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (post) => `/analyses/${post.slug}`
    }
  }
}));
var contentlayer_config_default = makeSource({
  contentDirPath: "analyses",
  documentTypes: [Analysis]
});
export {
  Analysis,
  contentlayer_config_default as default
};
//# sourceMappingURL=compiled-contentlayer-config-E7MHB5XW.mjs.map
