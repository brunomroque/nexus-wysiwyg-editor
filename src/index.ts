// Main Component
export { NexusWysiwygEditor } from "./components/NexusWysiwygEditor";
export type { NexusWysiwygEditorProps } from "./components/NexusWysiwygEditor";

// Plugins and Registry
export { defaultPlugins, defaultCorePlugin } from "./plugins/defaultPlugins";
export { WysiwygCommandRegistry } from "./plugins/commandRegistry";
export type {
  WysiwygPlugin,
  ToolbarItem,
  CommandHandler,
  CommandMeta,
  CommandContext,
} from "./plugins/pluginContracts";

// Extensions
export { MergeTagNode } from "./extensions/mergeTagExtension";

// Core Tools and Pipelines
export {
  plainTextToHtml,
  sanitizeHtml,
  sanitizePastedHtml,
} from "./core/pastePipeline";
export {
  htmlToMarkdown,
  markdownToHtml,
  enqueueExportJob,
  type ExportFormat,
  type ExportJob,
} from "./core/conversionPipeline";
export {
  extractTocFromHtml,
  appendFootnoteHtml,
  appendPageBreakHtml,
  footnoteFragmentHtml,
  pageBreakFragmentHtml,
  type TocItem,
} from "./core/structuredDocumentTools";
export {
  DEFAULT_EDITOR_TEMPLATES,
  DEFAULT_MERGE_TAGS,
  resolveMergeTags,
  type EditorTemplate,
  type MergeTag,
} from "./core/templatesMergeTags";
export {
  checkAccessibilityFromHtml,
  checkLinkReachability,
  checkLinksFromHtml,
  spellcheckFromHtml,
  type AccessibilityIssue,
  type LinkIssue,
  type SpellIssue,
} from "./core/complianceEngines";
export { buildWordDiff, type DiffPart } from "./core/revisionDiff";
export { reanchorRangeByQuote } from "./core/reanchorEngine";
export { debounce, throttle } from "./core/performanceUtils";
export {
  serializeEditorContent,
  deserializeEditorContent,
} from "./core/serialization";

// Collaboration and Data Models
export {
  createCommentThread,
  createSuggestedEdit,
  createRevisionSnapshot,
  extractMentionIds,
  type CommentThread,
  type SuggestedEdit,
  type RevisionSnapshot,
  type MentionCandidate,
} from "./core/collaborationModel";

// Adapters
export {
  LocalStorageAdapter,
  defaultStorageAdapter,
} from "./adapters/memoryStorageAdapter";
export {
  createSupabaseAdapter,
  type SupabaseAdapterOptions,
} from "./adapters/supabaseAdapter";
export type {
  StorageAdapter,
  CollaborationAdapter,
  TemplateAdapter,
  AuditAdapter,
  CollaborationBundle,
  EditorialAuditEntry,
  ImageUploadHandler,
} from "./adapters/types";

// i18n
export {
  getTranslations,
  ptBR,
  en,
  type EditorTranslations,
  type SupportedLocale,
} from "./i18n";

