import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import type { WysiwygPlugin } from "./pluginContracts";
import { MergeTagNode } from "../extensions/mergeTagExtension";

export const defaultCorePlugin: WysiwygPlugin = {
  id: "core-rich-text",
  title: "Core Rich Text",
  lazyLoadable: false,
  createExtensions: () => [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: {
        rel: "noopener noreferrer",
        target: "_blank",
      },
    }),
    Image.configure({
      inline: false,
      allowBase64: true,
    }),
    Table.configure({
      resizable: true,
      allowTableNodeSelection: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    Placeholder.configure({
      placeholder: "Start typing...",
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
      alignments: ["left", "center", "right", "justify"],
      defaultAlignment: "left",
    }),
    MergeTagNode,
  ],
  commands: {
    "text.bold": ({ editor }) => editor.chain().focus().toggleBold().run(),
    "text.italic": ({ editor }) => editor.chain().focus().toggleItalic().run(),
    "text.underline": ({ editor }) => editor.chain().focus().toggleUnderline().run(),
    "text.paragraph": ({ editor }) => editor.chain().focus().setParagraph().run(),
    "text.heading1": ({ editor }) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    "text.heading2": ({ editor }) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    "text.bulletList": ({ editor }) => editor.chain().focus().toggleBulletList().run(),
    "text.orderedList": ({ editor }) => editor.chain().focus().toggleOrderedList().run(),
    "history.undo": ({ editor }) => editor.chain().focus().undo().run(),
    "history.redo": ({ editor }) => editor.chain().focus().redo().run(),
    "insert.link": ({ editor, payload }) => {
      const href = String(payload?.href ?? "").trim();
      if (!href) {
        return editor.chain().focus().unsetLink().run();
      }
      return editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    },
    "insert.image": ({ editor, payload }) => {
      const normalized = String(payload?.src ?? "").trim();
      if (!normalized) return false;
      return editor.chain().focus().setImage({ src: normalized }).run();
    },
    "insert.table": ({ editor }) =>
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
    "table.addRowBefore": ({ editor }) => editor.chain().focus().addRowBefore().run(),
    "table.addRowAfter": ({ editor }) => editor.chain().focus().addRowAfter().run(),
    "table.deleteRow": ({ editor }) => editor.chain().focus().deleteRow().run(),
    "table.addColumnBefore": ({ editor }) => editor.chain().focus().addColumnBefore().run(),
    "table.addColumnAfter": ({ editor }) => editor.chain().focus().addColumnAfter().run(),
    "table.deleteColumn": ({ editor }) => editor.chain().focus().deleteColumn().run(),
    "table.toggleHeaderCell": ({ editor }) => editor.chain().focus().toggleHeaderCell().run(),
    "table.mergeOrSplit": ({ editor }) => editor.chain().focus().mergeOrSplit().run(),
    "text.alignLeft": ({ editor }) => editor.chain().focus().setTextAlign("left").run(),
    "text.alignCenter": ({ editor }) => editor.chain().focus().setTextAlign("center").run(),
    "text.alignRight": ({ editor }) => editor.chain().focus().setTextAlign("right").run(),
    "text.alignJustify": ({ editor }) => editor.chain().focus().setTextAlign("justify").run(),
    "table.alignTop": ({ editor }) => editor.chain().focus().setCellAttribute("style", "vertical-align: top;").run(),
    "table.alignMiddle": ({ editor }) => editor.chain().focus().setCellAttribute("style", "vertical-align: middle;").run(),
    "table.alignBottom": ({ editor }) => editor.chain().focus().setCellAttribute("style", "vertical-align: bottom;").run(),
  },
  commandMeta: {
    "text.bold": { title: "Bold", category: "format" },
    "text.italic": { title: "Italic", category: "format" },
    "text.underline": { title: "Underline", category: "format" },
    "text.paragraph": { title: "Paragraph", category: "format" },
    "text.heading1": { title: "Heading 1", category: "format" },
    "text.heading2": { title: "Heading 2", category: "format" },
    "text.bulletList": { title: "Bullet List", category: "format" },
    "text.orderedList": { title: "Numbered List", category: "format" },
    "insert.link": { title: "Insert Link", category: "insert" },
    "insert.image": { title: "Insert Image", category: "insert" },
    "insert.table": { title: "Insert Table", category: "table" },
    "history.undo": { title: "Undo", category: "history" },
    "history.redo": { title: "Redo", category: "history" },
  },
  toolbarItems: [
    { id: "undo", label: "Undo", commandId: "history.undo" },
    { id: "redo", label: "Redo", commandId: "history.redo" },
    {
      id: "h1",
      label: "H1",
      commandId: "text.heading1",
      isActive: (editor) => editor.isActive("heading", { level: 1 }),
    },
    {
      id: "h2",
      label: "H2",
      commandId: "text.heading2",
      isActive: (editor) => editor.isActive("heading", { level: 2 }),
    },
    {
      id: "bold",
      label: "Bold",
      commandId: "text.bold",
      isActive: (editor) => editor.isActive("bold"),
    },
    {
      id: "italic",
      label: "Italic",
      commandId: "text.italic",
      isActive: (editor) => editor.isActive("italic"),
    },
    {
      id: "underline",
      label: "Underline",
      commandId: "text.underline",
      isActive: (editor) => editor.isActive("underline"),
    },
    {
      id: "alignLeft",
      label: "Align Left",
      commandId: "text.alignLeft",
      isActive: (editor) => editor.isActive({ textAlign: "left" }),
    },
    {
      id: "alignCenter",
      label: "Align Center",
      commandId: "text.alignCenter",
      isActive: (editor) => editor.isActive({ textAlign: "center" }),
    },
    {
      id: "alignRight",
      label: "Align Right",
      commandId: "text.alignRight",
      isActive: (editor) => editor.isActive({ textAlign: "right" }),
    },
    {
      id: "alignJustify",
      label: "Justify",
      commandId: "text.alignJustify",
      isActive: (editor) => editor.isActive({ textAlign: "justify" }),
    },
    {
      id: "bulletList",
      label: "Bullet List",
      commandId: "text.bulletList",
      isActive: (editor) => editor.isActive("bulletList"),
    },
    {
      id: "orderedList",
      label: "Ordered List",
      commandId: "text.orderedList",
      isActive: (editor) => editor.isActive("orderedList"),
    },
    {
      id: "link",
      label: "Link",
      commandId: "insert.link",
      isActive: (editor) => editor.isActive("link"),
    },
    { id: "table", label: "Table", commandId: "insert.table" },
  ],
  quickToolbarItems: [
    { id: "q-bold", label: "Bold", commandId: "text.bold" },
    { id: "q-italic", label: "Italic", commandId: "text.italic" },
    { id: "q-link", label: "Link", commandId: "insert.link" },
  ],
};

export const defaultPlugins: WysiwygPlugin[] = [defaultCorePlugin];

