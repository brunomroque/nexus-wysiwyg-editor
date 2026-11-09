import type { Editor } from "@tiptap/core";
import type { CommandHandler, CommandMeta, WysiwygPlugin } from "./pluginContracts";

export type CommandRegistryOptions = {
  editor: Editor;
  plugins: WysiwygPlugin[];
  emitMetric?: (name: string, payload?: Record<string, unknown>) => void;
};

export class WysiwygCommandRegistry {
  private readonly editor: Editor;
  private readonly emitMetric: (name: string, payload?: Record<string, unknown>) => void;
  private readonly handlers = new Map<string, CommandHandler>();
  private readonly meta = new Map<string, CommandMeta>();

  constructor(options: CommandRegistryOptions) {
    this.editor = options.editor;
    this.emitMetric = options.emitMetric ?? (() => undefined);

    for (const plugin of options.plugins) {
      for (const [commandId, handler] of Object.entries(plugin.commands ?? {})) {
        this.handlers.set(commandId, handler);
        const details = plugin.commandMeta?.[commandId];
        this.meta.set(commandId, {
          id: commandId,
          title: details?.title ?? commandId,
          category: details?.category ?? "custom",
        });
      }
    }
  }

  execute(commandId: string, payload?: Record<string, unknown>): boolean {
    const handler = this.handlers.get(commandId);
    if (!handler) return false;

    const start = performance.now();
    const ok = handler({
      editor: this.editor,
      payload,
      emitMetric: this.emitMetric,
    });
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    const details = this.meta.get(commandId);
    this.emitMetric("editor.command.execute", {
      commandId,
      ok,
      durationMs,
      category: details?.category ?? "custom",
    });
    return ok;
  }

  has(commandId: string): boolean {
    return this.handlers.has(commandId);
  }

  getMeta(commandId: string): CommandMeta | null {
    return this.meta.get(commandId) ?? null;
  }
}

