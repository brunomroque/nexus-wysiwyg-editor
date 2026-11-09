import { Node, mergeAttributes } from "@tiptap/core";

export const MergeTagNode = Node.create({
  name: "mergeTag",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      token: {
        default: "{{unknown}}",
      },
      label: {
        default: "Merge Tag",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-merge-tag]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-merge-tag": "true",
        contenteditable: "false",
        class: "merge-tag",
      }),
      HTMLAttributes.token ?? "{{unknown}}",
    ];
  },
});

