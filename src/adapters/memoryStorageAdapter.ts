import type {
  AuditAdapter,
  CollaborationAdapter,
  CollaborationBundle,
  EditorialAuditEntry,
  StorageAdapter,
  TemplateAdapter,
} from "./types";
import type {
  CommentThread,
  RevisionSnapshot,
  SuggestedEdit,
} from "../core/collaborationModel";
import { DEFAULT_EDITOR_TEMPLATES, type EditorTemplate } from "../core/templatesMergeTags";

export class LocalStorageAdapter
  implements StorageAdapter, CollaborationAdapter, TemplateAdapter, AuditAdapter
{
  private memory = new Map<string, string>();

  private getItem(key: string): string | null {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return this.memory.get(key) ?? null;
  }

  private setItem(key: string, val: string): void {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, val);
    } else {
      this.memory.set(key, val);
    }
  }

  load(key: string): string | null {
    return this.getItem(`nexus:doc:${key}`);
  }

  save(key: string, content: string): void {
    this.setItem(`nexus:doc:${key}`, content);
  }

  async loadBundle(key: string): Promise<CollaborationBundle> {
    const raw = this.getItem(`nexus:collab:${key}`);
    if (!raw) {
      return { comments: [], suggestions: [], revisions: [] };
    }
    try {
      return JSON.parse(raw) as CollaborationBundle;
    } catch {
      return { comments: [], suggestions: [], revisions: [] };
    }
  }

  private saveBundle(key: string, bundle: CollaborationBundle): void {
    this.setItem(`nexus:collab:${key}`, JSON.stringify(bundle));
  }

  async insertComment(key: string, thread: CommentThread): Promise<void> {
    const bundle = await this.loadBundle(key);
    bundle.comments.push(thread);
    this.saveBundle(key, bundle);
  }

  async updateCommentStatus(
    key: string,
    commentId: string,
    status: "open" | "resolved",
  ): Promise<void> {
    const bundle = await this.loadBundle(key);
    const item = bundle.comments.find((c) => c.id === commentId);
    if (item) {
      item.status = status;
      this.saveBundle(key, bundle);
    }
  }

  async insertSuggestion(key: string, suggestion: SuggestedEdit): Promise<void> {
    const bundle = await this.loadBundle(key);
    bundle.suggestions.push(suggestion);
    this.saveBundle(key, bundle);
  }

  async updateSuggestionStatus(
    key: string,
    suggestionId: string,
    status: "pending" | "accepted" | "rejected",
  ): Promise<void> {
    const bundle = await this.loadBundle(key);
    const item = bundle.suggestions.find((s) => s.id === suggestionId);
    if (item) {
      item.status = status;
      this.saveBundle(key, bundle);
    }
  }

  async insertRevision(key: string, revision: RevisionSnapshot): Promise<void> {
    const bundle = await this.loadBundle(key);
    bundle.revisions.unshift(revision);
    this.saveBundle(key, bundle);
  }

  async loadTemplates(sectionKey?: string): Promise<EditorTemplate[]> {
    const raw = this.getItem("nexus:templates");
    let templates: EditorTemplate[] = DEFAULT_EDITOR_TEMPLATES;
    if (raw) {
      try {
        templates = JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    if (sectionKey) {
      return templates.filter((t) => !t.sectionKey || t.sectionKey === sectionKey);
    }
    return templates;
  }

  async upsertTemplate(template: EditorTemplate): Promise<void> {
    const current = await this.loadTemplates();
    const existingIdx = current.findIndex((t) => t.id === template.id);
    if (existingIdx >= 0) {
      current[existingIdx] = template;
    } else {
      current.push(template);
    }
    this.setItem("nexus:templates", JSON.stringify(current));
  }

  async logEntry(entry: Omit<EditorialAuditEntry, "id" | "createdAt">): Promise<void> {
    const raw = this.getItem(`nexus:audit:${entry.storageKey}`);
    const entries: EditorialAuditEntry[] = raw ? JSON.parse(raw) : [];
    entries.unshift({
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    });
    this.setItem(`nexus:audit:${entry.storageKey}`, JSON.stringify(entries.slice(0, 100)));
  }

  async listEntries(
    key: string,
    limit = 20,
    offset = 0,
  ): Promise<EditorialAuditEntry[]> {
    const raw = this.getItem(`nexus:audit:${key}`);
    if (!raw) return [];
    try {
      const entries: EditorialAuditEntry[] = JSON.parse(raw);
      return entries.slice(offset, offset + limit);
    } catch {
      return [];
    }
  }
}

export const defaultStorageAdapter = new LocalStorageAdapter();

