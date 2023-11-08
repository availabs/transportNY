const docsPageFormat = {
  app: "npmrds",
  type: "docs-page",
  defaultSearch: `data ->> 'index' = '0' and data ->> 'parent' = ''`,
  defaultSort: (d) => d.sort((a,b) => a.index - b.index || a.parent-b.parent),
  attributes: [
    { key: "title",
      type: "text",
      required: true,
      default: "New Page"
    },
    { key: "description",
      type: "text",
      required: true,
      default: "New Page"
    },
    {
      key: "index",
      type: "number",
      default: "props:index",
      editable: false,
      hidden: true
    },
    {
      key: "parent",
      type: "text",
      default: "",
      editable: false,
      hidden: true
    },
    {
      key: 'url_slug',
      type: "text",
      matchWildcard: true,
      hidden: true
    },
    {
      key: 'docs-content',
      type: 'lexical'
    }
  ]
}

export default docsPageFormat