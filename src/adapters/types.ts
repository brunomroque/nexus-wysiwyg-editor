import type {
  CommentThread,
  RevisionSnapshot,
  SuggestedEdit,
} from "../core/collaborationModel";
import type { EditorTemplate } from "../core/templatesMergeTags";

export type CollaborationBundle = {
  comments: CommentThread[];
  suggestions: SuggestedEdit[];
  revisions: RevisionSnapshot[];
};

export type EditorialAuditEntry = {
  id: string;
  storageKey: string;
  actorId: string;
  action: string;
  detail: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export interface StorageAdapter {
  load: (key: string) => Promise<string | null> | (string | null);
  save: (key: string, content: string) => Promise<void> | void;
}

export interface CollaborationAdapter {
  loadBundle: (key: string) => Promise<CollaborationBundle>;
  subscribe?: (key: string, onChange: () => void) => () => void;
  insertComment: (key: string, thread: CommentThread) => Promise<void>;
  updateCommentStatus: (key: string, commentId: string, status: "open" | "resolved") => Promise<void>;
  insertSuggestion: (key: string, suggestion: SuggestedEdit) => Promise<void>;
  updateSuggestionStatus: (
    key: string,
    suggestionId: string,
    status: "pending" | "accepted" | "rejected",
  ) => Promise<void>;
  insertRevision: (key: string, revision: RevisionSnapshot) => Promise<void>;
}

export interface TemplateAdapter {
  loadTemplates: (sectionKey?: string) => Promise<EditorTemplate[]>;
  upsertTemplate?: (template: EditorTemplate) => Promise<void>;
}

export interface AuditAdapter {
  logEntry: (entry: Omit<EditorialAuditEntry, "id" | "createdAt">) => Promise<void>;
  listEntries: (key: string, limit?: number, offset?: number) => Promise<EditorialAuditEntry[]>;
}

export type ImageUploadHandler = (file: File) => Promise<string>;

