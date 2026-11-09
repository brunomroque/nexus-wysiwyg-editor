import type { AnyExtension, Editor } from "@tiptap/core";

export type CommandContext = {
  editor: Editor;
  payload?: Record<string, unknown>;
  emitMetric: (name: string, payload?: Record<string, unknown>) => void;
};

export type CommandHandler = (context: CommandContext) => boolean;

export type CommandMeta = {
  id: string;
  title: string;
  category: "format" | "insert" | "history" | "table" | "search" | "view" | "custom";
};

export type ToolbarItem = {
  id: string;
  label: string;
  commandId: string;
  isActive?: (editor: Editor) => boolean;
  isDisabled?: (editor: Editor) => boolean;
};

export type WysiwygPlugin = {
  id: string;
  title: string;
  dependencies?: string[];
  lazyLoadable?: boolean;
  createExtensions: () => AnyExtension[];
  commands?: Record<string, CommandHandler>;
  commandMeta?: Record<string, Omit<CommandMeta, "id">>;
  toolbarItems?: ToolbarItem[];
  quickToolbarItems?: ToolbarItem[];
};

