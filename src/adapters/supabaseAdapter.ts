import type {
  AuditAdapter,
  CollaborationAdapter,
  CollaborationBundle,
  EditorialAuditEntry,
  TemplateAdapter,
} from "./types";
import type {
  CommentThread,
  RevisionSnapshot,
  SuggestedEdit,
} from "../core/collaborationModel";
import type { EditorTemplate } from "../core/templatesMergeTags";
import { DEFAULT_EDITOR_TEMPLATES } from "../core/templatesMergeTags";

export type SupabaseAdapterOptions = {
  supabaseClient: any;
  tenantId?: string;
  commentsTable?: string;
  suggestionsTable?: string;
  revisionsTable?: string;
  templatesTable?: string;
  auditTable?: string;
};

export function createSupabaseAdapter(options: SupabaseAdapterOptions): CollaborationAdapter & TemplateAdapter & AuditAdapter {
  const {
    supabaseClient,
    tenantId,
    commentsTable = "editorial_comments",
    suggestionsTable = "editorial_suggestions",
    revisionsTable = "editorial_revisions",
    templatesTable = "editorial_templates",
    auditTable = "editorial_audit_logs",
  } = options;

  return {
    async loadBundle(key: string): Promise<CollaborationBundle> {
      let commentsQuery = supabaseClient
        .from(commentsTable)
        .select("*")
        .eq("storage_key", key);
      let suggestionsQuery = supabaseClient
        .from(suggestionsTable)
        .select("*")
        .eq("storage_key", key);
      let revisionsQuery = supabaseClient
        .from(revisionsTable)
        .select("*")
        .eq("storage_key", key)
        .order("created_at", { ascending: false });

      if (tenantId) {
        commentsQuery = commentsQuery.eq("tenant_id", tenantId);
        suggestionsQuery = suggestionsQuery.eq("tenant_id", tenantId);
        revisionsQuery = revisionsQuery.eq("tenant_id", tenantId);
      }

      const [cRes, sRes, rRes] = await Promise.all([
        commentsQuery,
        suggestionsQuery,
        revisionsQuery,
      ]);

      return {
        comments: (cRes.data ?? []).map((row: any) => ({
          id: row.id,
          authorId: row.author_id,
          from: row.range_from,
          to: row.range_to,
          quote: row.quote,
          message: row.message,
          mentions: row.mentions ?? [],
          status: row.status,
          createdAt: row.created_at,
        })),
        suggestions: (sRes.data ?? []).map((row: any) => ({
          id: row.id,
          authorId: row.author_id,
          from: row.range_from,
          to: row.range_to,
          originalText: row.original_text,
          proposedText: row.proposed_text,
          status: row.status,
          createdAt: row.created_at,
        })),
        revisions: (rRes.data ?? []).map((row: any) => ({
          id: row.id,
          authorId: row.author_id,
          label: row.label,
          html: row.html_content,
          createdAt: row.created_at,
        })),
      };
    },

    subscribe(key: string, onChange: () => void): () => void {
      const channel = supabaseClient
        .channel(`nexus-collab-${key}`)
        .on("postgres_changes", { event: "*", schema: "public", table: commentsTable }, () => onChange())
        .on("postgres_changes", { event: "*", schema: "public", table: suggestionsTable }, () => onChange())
        .on("postgres_changes", { event: "*", schema: "public", table: revisionsTable }, () => onChange())
        .subscribe();

      return () => {
        void supabaseClient.removeChannel(channel);
      };
    },

    async insertComment(key: string, thread: CommentThread): Promise<void> {
      await supabaseClient.from(commentsTable).insert({
        id: thread.id,
        storage_key: key,
        author_id: thread.authorId,
        range_from: thread.from,
        range_to: thread.to,
        quote: thread.quote,
        message: thread.message,
        mentions: thread.mentions,
        status: thread.status,
        tenant_id: tenantId,
      });
    },

    async updateCommentStatus(
      _key: string,
      commentId: string,
      status: "open" | "resolved",
    ): Promise<void> {
      await supabaseClient
        .from(commentsTable)
        .update({ status })
        .eq("id", commentId);
    },

    async insertSuggestion(key: string, suggestion: SuggestedEdit): Promise<void> {
      await supabaseClient.from(suggestionsTable).insert({
        id: suggestion.id,
        storage_key: key,
        author_id: suggestion.authorId,
        range_from: suggestion.from,
        range_to: suggestion.to,
        original_text: suggestion.originalText,
        proposed_text: suggestion.proposedText,
        status: suggestion.status,
        tenant_id: tenantId,
      });
    },

    async updateSuggestionStatus(
      _key: string,
      suggestionId: string,
      status: "pending" | "accepted" | "rejected",
    ): Promise<void> {
      await supabaseClient
        .from(suggestionsTable)
        .update({ status })
        .eq("id", suggestionId);
    },

    async insertRevision(key: string, revision: RevisionSnapshot): Promise<void> {
      await supabaseClient.from(revisionsTable).insert({
        id: revision.id,
        storage_key: key,
        author_id: revision.authorId,
        label: revision.label,
        html_content: revision.html,
        tenant_id: tenantId,
      });
    },

    async loadTemplates(sectionKey?: string): Promise<EditorTemplate[]> {
      let query = supabaseClient.from(templatesTable).select("*");
      if (tenantId) query = query.eq("tenant_id", tenantId);
      if (sectionKey) query = query.eq("section_key", sectionKey);

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return DEFAULT_EDITOR_TEMPLATES;
      }
      return data.map((row: any) => ({
        id: row.id,
        label: row.title || row.label,
        html: row.html_template || row.html,
        sectionKey: row.section_key,
      }));
    },

    async upsertTemplate(template: EditorTemplate): Promise<void> {
      await supabaseClient.from(templatesTable).upsert({
        id: template.id,
        title: template.label,
        html_template: template.html,
        section_key: template.sectionKey,
        tenant_id: tenantId,
      });
    },

    async logEntry(entry: Omit<EditorialAuditEntry, "id" | "createdAt">): Promise<void> {
      await supabaseClient.from(auditTable).insert({
        storage_key: entry.storageKey,
        actor_id: entry.actorId,
        action: entry.action,
        detail: entry.detail,
        metadata: entry.metadata,
        tenant_id: tenantId,
      });
    },

    async listEntries(
      key: string,
      limit = 20,
      offset = 0,
    ): Promise<EditorialAuditEntry[]> {
      let query = supabaseClient
        .from(auditTable)
        .select("*")
        .eq("storage_key", key)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (tenantId) query = query.eq("tenant_id", tenantId);

      const { data, error } = await query;
      if (error || !data) return [];
      return data.map((row: any) => ({
        id: row.id,
        storageKey: row.storage_key,
        actorId: row.actor_id,
        action: row.action,
        detail: row.detail,
        createdAt: row.created_at,
        metadata: row.metadata,
      }));
    },
  };
}

