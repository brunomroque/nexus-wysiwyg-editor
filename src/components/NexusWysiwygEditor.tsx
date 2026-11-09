import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import {
  AlertCircle,
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bold,
  Bot,
  Check,
  CheckCircle2,
  CornerDownLeft,
  Eye,
  EyeOff,
  FileText,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Maximize2,
  Minimize2,
  Pilcrow,
  Redo2,
  Search,
  Sliders,
  Sparkles,
  Table2,
  Underline as UnderlineIcon,
  Undo2,
  Wand2,
  X,
} from "lucide-react";

import { NexusLogoIcon } from "./NexusLogoIcon";

import {
  type OpenAiConfig,
  type AiExecutionResult,
  sendOpenAiAgentRequest,
  resolveOpenAiConfig,
} from "../core/openAiAgent";

import { WysiwygCommandRegistry } from "../plugins/commandRegistry";
import { defaultPlugins } from "../plugins/defaultPlugins";
import type { WysiwygPlugin } from "../plugins/pluginContracts";
import { plainTextToHtml, sanitizeHtml, sanitizePastedHtml } from "../core/pastePipeline";
import {
  createCommentThread,
  createRevisionSnapshot,
  createSuggestedEdit,
  type CommentThread,
  type MentionCandidate,
  type RevisionSnapshot,
  type SuggestedEdit,
} from "../core/collaborationModel";
import {
  checkAccessibilityFromHtml,
  checkLinksFromHtml,
  spellcheckFromHtml,
  type AccessibilityIssue,
  type LinkIssue,
  type SpellIssue,
} from "../core/complianceEngines";
import {
  enqueueExportJob,
  htmlToMarkdown,
  markdownToHtml,
} from "../core/conversionPipeline";
import {
  DEFAULT_EDITOR_TEMPLATES,
  DEFAULT_MERGE_TAGS,
  type EditorTemplate,
  type MergeTag,
  resolveMergeTags,
} from "../core/templatesMergeTags";
import {
  extractTocFromHtml,
  footnoteFragmentHtml,
  pageBreakFragmentHtml,
  type TocItem,
} from "../core/structuredDocumentTools";
import { buildWordDiff } from "../core/revisionDiff";
import { debounce } from "../core/performanceUtils";
import { getTranslations, type EditorTranslations, type SupportedLocale } from "../i18n";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "./ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { EditorThemeContext } from "./ui/utils";
import { defaultStorageAdapter } from "../adapters/memoryStorageAdapter";
import type {
  AuditAdapter,
  CollaborationAdapter,
  EditorialAuditEntry,
  ImageUploadHandler,
  StorageAdapter,
  TemplateAdapter,
} from "../adapters/types";

export type NexusWysiwygEditorProps = {
  value?: string;
  defaultValue?: string;
  onChange?: (html: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  storageKey?: string;
  autoSave?: boolean;
  locale?: SupportedLocale | string;
  translations?: Partial<EditorTranslations>;
  theme?: "light" | "dark" | "auto" | "obsidian" | "editorial" | "glass" | "playful";
  className?: string;
  showRightPanel?: boolean;
  currentUserId?: string;
  mentionCandidates?: MentionCandidate[];
  plugins?: WysiwygPlugin[];
  templates?: EditorTemplate[];
  mergeTags?: MergeTag[];
  mergeTagValues?: Record<string, string>;
  storageAdapter?: StorageAdapter;
  collaborationAdapter?: CollaborationAdapter;
  templateAdapter?: TemplateAdapter;
  auditAdapter?: AuditAdapter;
  onUploadImage?: ImageUploadHandler;
  onMetric?: (name: string, payload?: Record<string, unknown>) => void;
  onExport?: (format: "pdf" | "docx", html: string) => void | Promise<void>;
  aiConfig?: OpenAiConfig;
  onAiAction?: (result: AiExecutionResult) => void;
};

const DEFAULT_STORAGE_KEY = "nexus-wysiwyg-draft";
const INITIAL_HTML = "<p>Start typing your document with Nexus Editor...</p>";

function renderCommandIcon(commandId: string) {
  const className = "h-4 w-4";
  switch (commandId) {
    case "text.paragraph":
      return <Pilcrow className={className} />;
    case "text.heading1":
      return <Heading1 className={className} />;
    case "text.heading2":
      return <Heading2 className={className} />;
    case "text.bold":
      return <Bold className={className} />;
    case "text.italic":
      return <Italic className={className} />;
    case "text.underline":
      return <UnderlineIcon className={className} />;
    case "text.alignLeft":
      return <AlignLeft className={className} />;
    case "text.alignCenter":
      return <AlignCenter className={className} />;
    case "text.alignRight":
      return <AlignRight className={className} />;
    case "text.alignJustify":
      return <AlignJustify className={className} />;
    case "text.bulletList":
      return <List className={className} />;
    case "text.orderedList":
      return <ListOrdered className={className} />;
    case "insert.link":
      return <LinkIcon className={className} />;
    case "insert.image":
      return <ImageIcon className={className} />;
    case "insert.table":
      return <Table2 className={className} />;
    case "table.addRowBefore":
      return <ArrowUp className={className} />;
    case "table.addRowAfter":
      return <ArrowDown className={className} />;
    case "table.alignTop":
      return <ArrowUp className={className} />;
    case "table.alignMiddle":
      return <ListTodo className={className} />;
    case "table.alignBottom":
      return <ArrowDown className={className} />;
    case "table.addColumnBefore":
      return <ArrowLeft className={className} />;
    case "table.addColumnAfter":
      return <ArrowRight className={className} />;
    case "table.deleteRow":
    case "table.deleteColumn":
    case "table.toggleHeaderCell":
    case "table.mergeOrSplit":
      return <Table2 className={className} />;
    case "history.undo":
      return <Undo2 className={className} />;
    case "history.redo":
      return <Redo2 className={className} />;
    default:
      return null;
  }
}

function collectWordCount(editor: Editor): number {
  const text = editor.getText().trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

export function NexusWysiwygEditor({
  value,
  defaultValue = INITIAL_HTML,
  onChange,
  readOnly = false,
  placeholder,
  storageKey = DEFAULT_STORAGE_KEY,
  autoSave = true,
  locale = "pt-BR",
  translations: customTranslations,
  theme = "auto",
  className = "",
  showRightPanel: initialShowRightPanel = false,
  currentUserId = "user-1",
  mentionCandidates = [],
  plugins = defaultPlugins,
  templates: customTemplates,
  mergeTags: customMergeTags,
  mergeTagValues = {},
  storageAdapter = defaultStorageAdapter,
  collaborationAdapter = defaultStorageAdapter,
  templateAdapter = defaultStorageAdapter,
  auditAdapter = defaultStorageAdapter,
  onUploadImage,
  onMetric,
  onExport,
  aiConfig,
  onAiAction,
}: NexusWysiwygEditorProps) {
  const t = useMemo(
    () => getTranslations(locale, customTranslations),
    [locale, customTranslations],
  );

  const activeMergeTags = useMemo(
    () => customMergeTags ?? DEFAULT_MERGE_TAGS,
    [customMergeTags],
  );

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(initialShowRightPanel);
  const [activePanelTab, setActivePanelTab] = useState<
    "preview" | "revisions" | "diff" | "compliance" | "audit" | "collab"
  >("preview");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");

  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInputHref, setLinkInputHref] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageInputSrc, setImageInputSrc] = useState("");
  const [footnoteText, setFootnoteText] = useState("");
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [previewWithTags, setPreviewWithTags] = useState(true);

  const [comments, setComments] = useState<CommentThread[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedEdit[]>([]);
  const [revisions, setRevisions] = useState<RevisionSnapshot[]>([]);
  const [auditEntries, setAuditEntries] = useState<EditorialAuditEntry[]>([]);

  const [linkIssues, setLinkIssues] = useState<LinkIssue[]>([]);
  const [a11yIssues, setA11yIssues] = useState<AccessibilityIssue[]>([]);
  const [spellIssues, setSpellIssues] = useState<SpellIssue[]>([]);

  const [templateCatalog, setTemplateCatalog] = useState<EditorTemplate[]>(
    customTemplates ?? DEFAULT_EDITOR_TEMPLATES,
  );

  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emitMetric = (name: string, payload?: Record<string, unknown>) => {
    onMetric?.(name, payload);
  };

  const [showAiModal, setShowAiModal] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [customApiKey, setCustomApiKey] = useState("");

  const activeAiConfig = useMemo(() => {
    const resolved = resolveOpenAiConfig(aiConfig);
    if (customApiKey.trim()) {
      resolved.apiKey = customApiKey.trim();
    }
    return resolved;
  }, [aiConfig, customApiKey]);

  const extensions = useMemo(() => {
    return plugins.flatMap((plugin) => plugin.createExtensions());
  }, [plugins]);

  const initialContent = useMemo(() => {
    if (value !== undefined) return value;
    if (autoSave && storageAdapter) {
      const persisted = storageAdapter.load(storageKey);
      if (persisted && typeof persisted === "string") return persisted;
    }
    return defaultValue;
  }, [value, defaultValue, autoSave, storageAdapter, storageKey]);

  const editor = useEditor({
    extensions,
    content: initialContent,
    editable: !readOnly,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: "tiptap focus:outline-none",
        "data-placeholder": placeholder || t.placeholder,
      },
      handlePaste: (_view, event) => {
        const text = event.clipboardData?.getData("text/plain");
        const html = event.clipboardData?.getData("text/html");
        if (html) {
          const sanitized = sanitizePastedHtml(html);
          editor?.commands.insertContent(sanitized);
          return true;
        }
        if (text) {
          const asHtml = plainTextToHtml(text);
          editor?.commands.insertContent(asHtml);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      onChange?.(html);
      debouncedSave(html);
    },
  });

  const commandRegistry = useMemo(() => {
    if (!editor) return null;
    return new WysiwygCommandRegistry({
      editor,
      plugins,
      emitMetric,
    });
  }, [editor, plugins]);

  const debouncedSave = useMemo(
    () =>
      debounce((html: string) => {
        if (!autoSave || !storageAdapter) return;
        setIsSaving(true);
        void Promise.resolve(storageAdapter.save(storageKey, html)).finally(() => {
          setIsSaving(false);
        });
      }, 800),
    [autoSave, storageAdapter, storageKey],
  );

  useEffect(() => {
    if (!editor || value === undefined) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [editor, readOnly]);

  const selectedSnippet = useMemo(() => {
    if (!editor) return "";
    const { from, to } = editor.state.selection;
    if (from === to) return "";
    const text = editor.state.doc.textBetween(from, to, " ").trim();
    return text.length > 90 ? text.substring(0, 90) + "..." : text;
  }, [editor, showAiModal]);

  // Load collaboration items
  useEffect(() => {
    if (!collaborationAdapter) return;
    let cancelled = false;

    void collaborationAdapter.loadBundle(storageKey).then((bundle) => {
      if (cancelled) return;
      setComments(bundle.comments);
      setSuggestions(bundle.suggestions);
      setRevisions(bundle.revisions);
    });

    const unsubscribe = collaborationAdapter.subscribe?.(storageKey, () => {
      void collaborationAdapter.loadBundle(storageKey).then((bundle) => {
        if (!cancelled) {
          setComments(bundle.comments);
          setSuggestions(bundle.suggestions);
          setRevisions(bundle.revisions);
        }
      });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [collaborationAdapter, storageKey]);

  // Load audit logs
  useEffect(() => {
    if (!auditAdapter) return;
    void auditAdapter.listEntries(storageKey, 20, 0).then((entries) => {
      setAuditEntries(entries);
    });
  }, [auditAdapter, storageKey]);

  // Load templates
  useEffect(() => {
    if (!templateAdapter) return;
    void templateAdapter.loadTemplates().then((tpls) => {
      if (tpls && tpls.length > 0) {
        setTemplateCatalog(tpls);
      }
    });
  }, [templateAdapter]);

  const wordCount = editor ? collectWordCount(editor) : 0;
  const charCount = editor ? editor.getText().length : 0;
  const readingTime = Math.ceil(wordCount / 200);

  const executeCommand = (commandId: string, payload?: Record<string, unknown>) => {
    commandRegistry?.execute(commandId, payload);
  };

  const handleApplyLink = () => {
    if (!editor) return;
    executeCommand("insert.link", { href: linkInputHref });
    setShowLinkInput(false);
    setLinkInputHref("");
  };

  const handleOpenLinkModal = () => {
    if (!editor) return;
    const currentHref = editor.getAttributes("link").href || "";
    setLinkInputHref(currentHref);
    setShowLinkInput(true);
  };

  const handleApplyImage = () => {
    if (!editor) return;
    executeCommand("insert.image", { src: imageInputSrc });
    setShowImageInput(false);
    setImageInputSrc("");
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    if (onUploadImage) {
      try {
        const url = await onUploadImage(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (err) {
        console.error("Image upload failed:", err);
      }
    } else {
      // Default fallback: base64 data url
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          editor.chain().focus().setImage({ src: reader.result }).run();
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleAddFootnote = () => {
    const text = window.prompt(t.footnotePlaceholder, footnoteText);
    if (!text?.trim() || !editor) return;
    const fragment = footnoteFragmentHtml(text);
    editor.chain().focus().insertContent(fragment).run();
    setFootnoteText(text);
  };

  const handleInsertPageBreak = () => {
    if (!editor) return;
    editor.chain().focus().insertContent(pageBreakFragmentHtml()).run();
  };

  const handleGenerateToc = () => {
    if (!editor) return;
    const items = extractTocFromHtml(editor.getHTML());
    setTocItems(items);
    setShowRightPanel(true);
    setActivePanelTab("preview");
  };

  const handleExport = async (format: "pdf" | "docx") => {
    if (!editor) return;
    const html = editor.getHTML();
    if (onExport) {
      await onExport(format, html);
      return;
    }
    const job = await enqueueExportJob(format, html);
    if (job.downloadUrl) {
      const a = document.createElement("a");
      a.href = job.downloadUrl;
      a.download = job.downloadName || `export.${format}`;
      a.click();
    }
  };

  const handleAddComment = async () => {
    if (!editor || !collaborationAdapter) return;
    const { from, to } = editor.state.selection;
    const quote = editor.state.doc.textBetween(from, to, " ");
    const message = window.prompt("Digite seu comentário:", "");
    if (!message?.trim()) return;

    const thread = createCommentThread({
      authorId: currentUserId,
      from,
      to,
      quote,
      message,
      candidates: mentionCandidates,
    });

    await collaborationAdapter.insertComment(storageKey, thread);
    setComments((prev) => [...prev, thread]);

    if (auditAdapter) {
      await auditAdapter.logEntry({
        storageKey,
        actorId: currentUserId,
        action: "comment_created",
        detail: `Comentário: "${message}" em "${quote.slice(0, 30)}"`,
      });
      const entries = await auditAdapter.listEntries(storageKey, 20, 0);
      setAuditEntries(entries);
    }
  };

  const handleAddSuggestion = async () => {
    if (!editor || !collaborationAdapter) return;
    const { from, to } = editor.state.selection;
    const originalText = editor.state.doc.textBetween(from, to, " ");
    const proposedText = window.prompt("Texto sugerido:", originalText);
    if (!proposedText || proposedText === originalText) return;

    const suggestion = createSuggestedEdit({
      authorId: currentUserId,
      from,
      to,
      originalText,
      proposedText,
    });

    await collaborationAdapter.insertSuggestion(storageKey, suggestion);
    setSuggestions((prev) => [...prev, suggestion]);

    if (auditAdapter) {
      await auditAdapter.logEntry({
        storageKey,
        actorId: currentUserId,
        action: "suggestion_created",
        detail: `Sugestão: "${originalText.slice(0, 20)}" -> "${proposedText.slice(0, 20)}"`,
      });
      const entries = await auditAdapter.listEntries(storageKey, 20, 0);
      setAuditEntries(entries);
    }
  };

  const handleSaveRevision = async () => {
    if (!editor || !collaborationAdapter) return;
    const label = window.prompt("Nome da revisão:", `Revisão ${new Date().toLocaleTimeString()}`);
    if (!label?.trim()) return;

    const snapshot = createRevisionSnapshot({
      authorId: currentUserId,
      label,
      html: editor.getHTML(),
    });

    await collaborationAdapter.insertRevision(storageKey, snapshot);
    setRevisions((prev) => [snapshot, ...prev]);

    if (auditAdapter) {
      await auditAdapter.logEntry({
        storageKey,
        actorId: currentUserId,
        action: "revision_saved",
        detail: `Snapshot de revisão: "${label}"`,
      });
      const entries = await auditAdapter.listEntries(storageKey, 20, 0);
      setAuditEntries(entries);
    }
  };

  const handleRunCompliance = () => {
    if (!editor) return;
    const html = editor.getHTML();
    setLinkIssues(checkLinksFromHtml(html));
    setA11yIssues(checkAccessibilityFromHtml(html));
    setSpellIssues(spellcheckFromHtml(html, locale));
    setShowRightPanel(true);
    setActivePanelTab("compliance");
  };

  const handleRunAi = async (overridePrompt?: string) => {
    if (!editor) return;
    const promptToRun = overridePrompt || aiPrompt;
    if (!promptToRun.trim()) return;

    setAiLoading(true);
    setAiMessage(null);
    emitMetric("ai.request.start", { prompt: promptToRun });

    try {
      const res = await sendOpenAiAgentRequest({
        userPrompt: promptToRun,
        editor,
        config: activeAiConfig,
        commandRegistry,
      });

      if (res.success) {
        setAiMessage({ text: res.message, isError: false });
        emitMetric("ai.request.success", { toolUsed: res.toolUsed });
        onAiAction?.(res);
        if (auditAdapter) {
          await auditAdapter.logEntry({
            storageKey,
            actorId: currentUserId,
            action: "ai_generation",
            detail: `Comando IA: "${promptToRun.slice(0, 40)}" -> ${res.toolUsed || "conteúdo gerado"}`,
          });
          const entries = await auditAdapter.listEntries(storageKey, 20, 0);
          setAuditEntries(entries);
        }
      } else {
        setAiMessage({ text: res.message, isError: true });
        emitMetric("ai.request.error", { message: res.message });
      }
    } catch (err: any) {
      setAiMessage({ text: String(err?.message || err), isError: true });
    } finally {
      setAiLoading(false);
    }
  };

  const serializedHtml = editor?.getHTML() ?? "";
  const previewHtml = previewWithTags
    ? resolveMergeTags(serializedHtml, mergeTagValues)
    : serializedHtml;

  const currentDiff = useMemo(() => {
    if (revisions.length === 0 || !editor) return [];
    return buildWordDiff(revisions[0].html.replace(/<[^>]+>/g, " "), editor.getText());
  }, [revisions, editor, serializedHtml]);

  if (!editor) {
    return (
      <div className="nexus-editor-container p-6 text-sm text-[var(--nexus-text-muted)]">
        Loading editor...
      </div>
    );
  }

  return (
    <EditorThemeContext.Provider value={theme}>
      <div
        className={`nexus-editor-container ${
          theme === "dark" || theme === "obsidian" ? "dark" : ""
        } theme-${theme} ${
          isFullscreen ? "is-fullscreen" : ""
        } ${className}`}
        data-theme={theme}
      >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        style={{ display: "none" }}
        onChange={handleImageFileChange}
      />

      {/* Menubar (Classic top navigation menus) */}
      <nav className="nexus-menubar">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="nexus-toolbar-btn font-medium">
              {t.menuFile}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onSelect={() => {
                const md = htmlToMarkdown(editor.getHTML());
                navigator.clipboard.writeText(md);
              }}
            >
              {t.htmlToMarkdown}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                const md = window.prompt("Paste Markdown content:");
                if (md) editor.commands.setContent(markdownToHtml(md));
              }}
            >
              {t.markdownToHtml}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void handleExport("pdf")}>
              {t.exportPdf}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void handleExport("docx")}>
              {t.exportDocx}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setIsFullscreen((prev) => !prev)}>
              {t.fullscreen}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="nexus-toolbar-btn font-medium">
              {t.menuEdit}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setShowSearchModal(true)}>
              {t.searchAndReplace}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                const { from, to } = editor.state.selection;
                const text = editor.state.doc.textBetween(from, to, " ");
                editor.commands.insertContent(text.toUpperCase());
              }}
            >
              {t.uppercase}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                const { from, to } = editor.state.selection;
                const text = editor.state.doc.textBetween(from, to, " ");
                editor.commands.insertContent(text.toLowerCase());
              }}
            >
              {t.lowercase}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="nexus-toolbar-btn font-medium">
              {t.menuInsert}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={handleOpenLinkModal}>
              {t.insertLink}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setShowImageInput(true)}>
              {t.insertImageUrl}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
              {t.uploadImage}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleInsertPageBreak}>
              {t.insertPageBreak}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleAddFootnote}>
              {t.addFootnote}
            </DropdownMenuItem>
            {templateCatalog.length > 0 && (
              <DropdownMenuItem
                onSelect={() => {
                  const title = window.prompt(
                    `Selecione o template:\n${templateCatalog.map((tpl, i) => `${i + 1}: ${tpl.label}`).join("\n")}`,
                    "1",
                  );
                  const idx = Number(title) - 1;
                  if (!isNaN(idx) && templateCatalog[idx] && editor) {
                    editor.commands.setContent(templateCatalog[idx].html);
                  }
                }}
              >
                {t.applySelectedTemplate}
              </DropdownMenuItem>
            )}
            {activeMergeTags.length > 0 && (
              <DropdownMenuItem
                onSelect={() => {
                  const choice = window.prompt(
                    `Inserir Tag:\n${activeMergeTags.map((tag, i) => `${i + 1}: ${tag.label} (${tag.token})`).join("\n")}`,
                    "1",
                  );
                  const idx = Number(choice) - 1;
                  if (!isNaN(idx) && activeMergeTags[idx] && editor) {
                    editor.chain().focus().insertContent(` ${activeMergeTags[idx].token} `).run();
                  }
                }}
              >
                {t.templatesAndMergeTags}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="nexus-toolbar-btn font-medium">
              {t.menuView}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onSelect={() => {
                setShowRightPanel((prev) => !prev);
                setActivePanelTab("preview");
              }}
            >
              {t.preview}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleGenerateToc}>
              {t.generateToc}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                setShowRightPanel(true);
                setActivePanelTab("diff");
              }}
            >
              {t.revisionHistory}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="nexus-toolbar-btn font-medium">
              {t.menuTools}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={handleRunCompliance}>
              {t.a11yChecker} & {t.linkChecker}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleRunCompliance}>
              {t.spellcheck}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="nexus-toolbar-btn font-medium">
              {t.menuFormat}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => executeCommand("text.bold")}>
              Negrito (Bold)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => executeCommand("text.italic")}>
              Itálico (Italic)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => executeCommand("text.underline")}>
              Sublinhado (Underline)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => executeCommand("text.paragraph")}>
              Parágrafo Normal
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => executeCommand("text.heading1")}>
              Título 1 (H1)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => executeCommand("text.heading2")}>
              Título 2 (H2)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => executeCommand("text.alignLeft")}>
              Alinhar à Esquerda
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => executeCommand("text.alignCenter")}>
              Centralizar
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => executeCommand("text.alignRight")}>
              Alinhar à Direita
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => executeCommand("text.alignJustify")}>
              Justificar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => executeCommand("text.bulletList")}>
              Lista com Marcadores
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => executeCommand("text.orderedList")}>
              Lista Numerada
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="nexus-toolbar-btn font-medium">
              {t.menuTable}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => executeCommand("insert.table")}>
              Inserir Tabela (3x3)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => executeCommand("table.addRowBefore")}>
              Inserir Linha Acima
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => executeCommand("table.addRowAfter")}>
              Inserir Linha Abaixo
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => executeCommand("table.deleteRow")}>
              Excluir Linha
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => executeCommand("table.addColumnBefore")}>
              Inserir Coluna à Esquerda
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => executeCommand("table.addColumnAfter")}>
              Inserir Coluna à Direita
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => executeCommand("table.deleteColumn")}>
              Excluir Coluna
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => executeCommand("table.toggleHeaderCell")}>
              Alternar Célula de Cabeçalho
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => executeCommand("table.mergeOrSplit")}>
              Mesclar / Dividir Células
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="nexus-toolbar-btn font-semibold text-[var(--nexus-accent)] gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t.menuAi}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onSelect={() => {
                setShowAiModal(true);
                setAiMessage(null);
              }}
            >
              <NexusLogoIcon size={16} className="mr-1.5" />
              {t.aiAssistant}...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() =>
                void handleRunAi("Melhore a escrita e clareza do texto selecionado mantendo o tom corporativo.")
              }
            >
              {t.aiImproveWriting}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                void handleRunAi("Resuma o trecho selecionado em tópicos objetivos e concisos.")
              }
            >
              {t.aiSummarize}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                void handleRunAi("Expanda os tópicos do texto selecionado acrescentando detalhes e contexto.")
              }
            >
              {t.aiExpand}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                void handleRunAi("Corrija quaisquer desvios de gramática, pontuação e concordância no texto selecionado.")
              }
            >
              {t.aiFixGrammar}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() =>
                void handleRunAi("Crie uma tabela comparativa com 3 colunas e 4 linhas contendo métricas relevantes.")
              }
            >
              Criar Tabela via IA (NLP)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="nexus-toolbar-btn font-medium">
              {t.menuComments}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => void handleAddComment()}>
              {t.addCommentFromSelection}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void handleAddSuggestion()}>
              {t.createSuggestionFromSelection}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void handleSaveRevision()}>
              {t.saveRevision}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-2">
          {isSaving ? (
            <span className="text-[11px] text-[var(--nexus-text-muted)] animate-pulse">
              {t.saving}
            </span>
          ) : (
            <span className="text-[11px] text-[var(--nexus-text-muted)]">{t.saved}</span>
          )}
          <button
            type="button"
            className="nexus-toolbar-btn"
            title={t.fullscreen}
            onClick={() => setIsFullscreen((prev) => !prev)}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </nav>

      {/* Main Toolbar */}
      <div className="nexus-toolbar">
        {plugins.flatMap((plugin) => plugin.toolbarItems ?? []).map((item) => {
          const active = item.isActive ? item.isActive(editor) : false;
          const disabled = item.isDisabled ? item.isDisabled(editor) : false;

          return (
            <button
              key={item.id}
              type="button"
              className={`nexus-toolbar-btn ${active ? "is-active" : ""}`}
              disabled={disabled}
              title={item.label}
              onClick={() => {
                if (item.commandId === "insert.link") {
                  handleOpenLinkModal();
                } else {
                  executeCommand(item.commandId);
                }
              }}
            >
              {renderCommandIcon(item.commandId) ?? item.label}
            </button>
          );
        })}

        <div className="nexus-toolbar-separator" />

        <button
          type="button"
          className="nexus-toolbar-btn font-semibold text-[var(--nexus-accent)] gap-1 px-2"
          title={t.aiAssistant}
          onClick={() => {
            setShowAiModal(true);
            setAiMessage(null);
          }}
        >
          <NexusLogoIcon size={16} />
          <span>IA</span>
        </button>

        <button
          type="button"
          className="nexus-toolbar-btn"
          title={t.searchAndReplace}
          onClick={() => setShowSearchModal(true)}
        >
          <Search className="h-4 w-4" />
        </button>

        <button
          type="button"
          className={`nexus-toolbar-btn ${showRightPanel ? "is-active" : ""}`}
          title={t.preview}
          onClick={() => setShowRightPanel((prev) => !prev)}
        >
          {showRightPanel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {/* Link and Image Popovers */}
      {showLinkInput ? (
        <div className="nexus-input-bar flex items-center gap-2 bg-[var(--nexus-surface-2)] p-2 border-b border-[var(--nexus-border)] text-xs">
          <LinkIcon className="h-4 w-4 text-[var(--nexus-accent)] shrink-0" />
          <input
            type="url"
            autoFocus
            placeholder="https://exemplo.com (ou deixe vazio para remover)"
            value={linkInputHref}
            onChange={(e) => setLinkInputHref(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApplyLink();
              } else if (e.key === "Escape") {
                setShowLinkInput(false);
              }
            }}
            className="nexus-input-field px-2 py-1 rounded border border-[var(--nexus-border)] bg-[var(--nexus-bg)] text-[var(--nexus-text)] flex-1"
          />
          <button
            type="button"
            onClick={handleApplyLink}
            className="nexus-btn-primary px-2.5 py-1 rounded bg-[var(--nexus-accent)] text-white font-medium"
          >
            {t.save}
          </button>
          {editor?.isActive("link") && (
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().unsetLink().run();
                setShowLinkInput(false);
                setLinkInputHref("");
              }}
              className="nexus-btn-secondary px-2 py-1 rounded text-red-500 font-medium"
              title="Remover Link"
            >
              Remover
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            className="nexus-toolbar-btn p-1 rounded text-[var(--nexus-text-muted)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {showImageInput ? (
        <div className="nexus-input-bar flex items-center gap-2 bg-[var(--nexus-surface-2)] p-2 border-b border-[var(--nexus-border)] text-xs">
          <input
            type="url"
            placeholder="https://example.com/image.png"
            value={imageInputSrc}
            onChange={(e) => setImageInputSrc(e.target.value)}
            className="nexus-input-field px-2 py-1 rounded border border-[var(--nexus-border)] bg-[var(--nexus-bg)] text-[var(--nexus-text)] flex-1"
          />
          <button
            type="button"
            onClick={handleApplyImage}
            className="nexus-btn-primary px-2 py-1 rounded bg-[var(--nexus-accent)] text-white font-medium"
          >
            {t.save}
          </button>
          <button
            type="button"
            onClick={() => setShowImageInput(false)}
            className="nexus-toolbar-btn p-1 rounded text-[var(--nexus-text-muted)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Main Body (Editor + Optional Side Panel) */}
      <div className="nexus-editor-body flex flex-1 overflow-hidden">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="nexus-tiptap-content flex-1 overflow-y-auto">
              <EditorContent editor={editor} />
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel>{t.quickActionsLabel}</ContextMenuLabel>
            <ContextMenuItem onSelect={() => void handleAddComment()}>
              {t.addCommentFromSelection}
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => void handleAddSuggestion()}>
              {t.createSuggestionFromSelection}
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => void handleSaveRevision()}>
              {t.saveRevision}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={handleRunCompliance}>
              {t.a11yChecker}
            </ContextMenuItem>
            <ContextMenuItem onSelect={handleGenerateToc}>
              {t.generateToc}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuLabel>Inteligência Artificial (OpenAI)</ContextMenuLabel>
            <ContextMenuItem onSelect={() => { setShowAiModal(true); setAiMessage(null); }}>
              <NexusLogoIcon size={15} className="mr-1.5" /> {t.aiAssistant}...
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => void handleRunAi("Melhore a escrita e clareza do texto selecionado mantendo o tom corporativo.")}>
              {t.aiImproveWriting}
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => void handleRunAi("Resuma o trecho selecionado em tópicos objetivos.")}>
              {t.aiSummarize}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {/* Right Inspection / Collaboration / Quality Drawer */}
        {showRightPanel ? (
          <aside className="nexus-side-panel w-80 border-l border-[var(--nexus-border)] bg-[var(--nexus-surface-1)] flex flex-col text-xs">
            <div className="nexus-side-panel-header flex items-center justify-between border-b border-[var(--nexus-border)] p-2 font-medium">
              <div className="nexus-side-panel-tabs flex gap-1">
                <button
                  type="button"
                  className={`nexus-side-panel-tab px-2 py-0.5 rounded ${
                    activePanelTab === "preview" ? "is-active bg-[var(--nexus-surface-2)] font-semibold" : ""
                  }`}
                  onClick={() => setActivePanelTab("preview")}
                >
                  {t.preview}
                </button>
                <button
                  type="button"
                  className={`nexus-side-panel-tab px-2 py-0.5 rounded ${
                    activePanelTab === "collab" ? "is-active bg-[var(--nexus-surface-2)] font-semibold" : ""
                  }`}
                  onClick={() => setActivePanelTab("collab")}
                >
                  {t.menuComments}
                </button>
                <button
                  type="button"
                  className={`nexus-side-panel-tab px-2 py-0.5 rounded ${
                    activePanelTab === "diff" ? "is-active bg-[var(--nexus-surface-2)] font-semibold" : ""
                  }`}
                  onClick={() => setActivePanelTab("diff")}
                >
                  Diff
                </button>
                <button
                  type="button"
                  className={`nexus-side-panel-tab px-2 py-0.5 rounded ${
                    activePanelTab === "compliance"
                      ? "is-active bg-[var(--nexus-surface-2)] font-semibold"
                      : ""
                  }`}
                  onClick={() => setActivePanelTab("compliance")}
                >
                  Quality
                </button>
                <button
                  type="button"
                  className={`nexus-side-panel-tab px-2 py-0.5 rounded ${
                    activePanelTab === "audit" ? "is-active bg-[var(--nexus-surface-2)] font-semibold" : ""
                  }`}
                  onClick={() => setActivePanelTab("audit")}
                >
                  Audit
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowRightPanel(false)}
                className="nexus-toolbar-btn text-[var(--nexus-text-muted)] hover:text-[var(--nexus-text)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="nexus-side-panel-content flex-1 overflow-y-auto p-3 space-y-3">
              {activePanelTab === "preview" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{t.preview}</span>
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={previewWithTags}
                        onChange={(e) => setPreviewWithTags(e.target.checked)}
                      />
                      Resolve Tags
                    </label>
                  </div>
                  <div
                    className="p-2 border border-[var(--nexus-border)] rounded bg-[var(--nexus-bg)] text-xs"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewHtml) }}
                  />

                  {tocItems.length > 0 ? (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-1">{t.generateToc}</h4>
                      <ul className="space-y-1 list-disc pl-4">
                        {tocItems.map((item, i) => (
                          <li key={i} className={`ml-${(item.level - 1) * 2}`}>
                            {item.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}

              {activePanelTab === "collab" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{t.menuComments}</span>
                    <button
                      type="button"
                      onClick={() => void handleAddComment()}
                      className="px-1.5 py-0.5 rounded bg-[var(--nexus-accent)] text-white text-[10px]"
                    >
                      + Novo
                    </button>
                  </div>
                  {comments.length === 0 ? (
                    <p className="text-[var(--nexus-text-muted)]">Nenhum comentário.</p>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-2 border border-[var(--nexus-border)] rounded bg-[var(--nexus-bg)] space-y-1"
                      >
                        <div className="font-semibold text-[11px] text-[var(--nexus-accent)]">
                          "{c.quote}"
                        </div>
                        <div>{c.message}</div>
                        <div className="text-[10px] text-[var(--nexus-text-muted)] flex justify-between">
                          <span>{c.authorId}</span>
                          <span>{c.status}</span>
                        </div>
                      </div>
                    ))
                  )}

                  <hr className="border-[var(--nexus-border)] my-2" />

                  <div className="font-semibold">Sugestões ({suggestions.length})</div>
                  {suggestions.map((s) => (
                    <div
                      key={s.id}
                      className="p-2 border border-[var(--nexus-border)] rounded bg-[var(--nexus-bg)] space-y-1"
                    >
                      <div className="line-through text-red-500">{s.originalText}</div>
                      <div className="text-emerald-500 font-medium">{s.proposedText}</div>
                      <div className="text-[10px] text-[var(--nexus-text-muted)]">{s.status}</div>
                    </div>
                  ))}
                </div>
              )}

              {activePanelTab === "diff" && (
                <div>
                  <div className="font-semibold mb-2">Word Diff vs Revisão Anterior</div>
                  <div className="p-2 border border-[var(--nexus-border)] rounded bg-[var(--nexus-bg)] leading-relaxed">
                    {currentDiff.map((part, idx) => (
                      <span
                        key={idx}
                        className={
                          part.type === "added"
                            ? "bg-emerald-500/20 text-emerald-600 font-medium"
                            : part.type === "removed"
                            ? "bg-rose-500/20 text-rose-600 line-through"
                            : ""
                        }
                      >
                        {part.text}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activePanelTab === "compliance" && (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-[var(--nexus-text)]">
                      Acessibilidade ({a11yIssues.length})
                    </h4>
                    {a11yIssues.length === 0 ? (
                      <p className="text-emerald-500 flex items-center gap-1 mt-1">
                        <Check className="h-3 w-3" /> Sem problemas de a11y detectados.
                      </p>
                    ) : (
                      a11yIssues.map((issue, idx) => (
                        <div
                          key={idx}
                          className="mt-1 p-1.5 border border-amber-500/40 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        >
                          {issue.message}
                        </div>
                      ))
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-[var(--nexus-text)]">
                      Links ({linkIssues.length})
                    </h4>
                    {linkIssues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="mt-1 p-1.5 border border-rose-500/40 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300"
                      >
                        {issue.message}: {issue.href}
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-semibold text-[var(--nexus-text)]">
                      Ortografia ({spellIssues.length})
                    </h4>
                    {spellIssues.map((issue, idx) => (
                      <div key={idx} className="mt-1 text-[11px] text-[var(--nexus-text-muted)]">
                        • {issue.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activePanelTab === "audit" && (
                <div className="space-y-2">
                  <div className="font-semibold text-[var(--nexus-text)]">
                    Auditoria ({auditEntries.length})
                  </div>
                  {auditEntries.length === 0 ? (
                    <p className="text-[var(--nexus-text-muted)]">Nenhum evento registrado.</p>
                  ) : (
                    auditEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-2 border border-[var(--nexus-border)] rounded bg-[var(--nexus-bg)] space-y-0.5"
                      >
                        <div className="font-medium text-[11px] text-[var(--nexus-accent)]">
                          {entry.action}
                        </div>
                        <div className="text-[11px]">{entry.detail}</div>
                        <div className="text-[10px] text-[var(--nexus-text-muted)]">
                          {new Date(entry.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </aside>
        ) : null}

        {/* Floating Copilot Pill (as seen in image) */}
        <button
          type="button"
          className="nexus-ai-floating-pill"
          onClick={() => {
            setShowAiModal(true);
            setAiMessage(null);
          }}
          title="Abrir Nexus AI Copilot"
        >
          <NexusLogoIcon size={18} style={{ filter: "drop-shadow(0 0 5px rgba(168, 85, 247, 0.6))" }} />
          <span className="nexus-ai-pill-text font-semibold">Nexus AI Copilot</span>
          <span className="nexus-ai-pill-badge">{activeAiConfig.model || "gpt-4o-mini"}</span>
        </button>
      </div>

      {/* AI Assistant Modal (Nexus AI Copilot - Modern Glowing Card) */}
      {showAiModal ? (
        <div
          className="nexus-ai-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !aiLoading) setShowAiModal(false);
          }}
        >
          <div className="nexus-ai-modal-card">
            {/* Header */}
            <div className="nexus-ai-modal-header">
              <div className="nexus-ai-brand">
                <NexusLogoIcon size={34} style={{ filter: "drop-shadow(0 0 10px rgba(168, 85, 247, 0.6))" }} />
                <div className="nexus-ai-title-wrap">
                  <span className="nexus-ai-title">Nexus AI Copilot</span>
                  <div className="nexus-ai-model-tag">
                    <span className="nexus-ai-status-dot pulse" />
                    <span>{activeAiConfig.model || "gpt-4o-mini"}</span>
                    <span>&bull; NLP Agent</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <button
                  type="button"
                  className="nexus-toolbar-btn text-slate-400 hover:text-white"
                  title="Configurar Provedor / API"
                  onClick={() => setShowAiSettings((prev) => !prev)}
                >
                  <Sliders className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="nexus-toolbar-btn text-slate-400 hover:text-white"
                  onClick={() => setShowAiModal(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Context Badge (if text is selected) */}
            {selectedSnippet ? (
              <div className="nexus-ai-context-banner">
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", overflow: "hidden" }}>
                  <FileText className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Trecho selecionado:</span>
                  <span className="nexus-ai-context-text">"{selectedSnippet}"</span>
                </div>
              </div>
            ) : null}

            {/* Quick Actions Grid */}
            <div className="nexus-ai-chips-grid">
              {[
                { icon: "✨", label: "Melhorar Escrita", prompt: "Melhore a escrita e torne o tom mais corporativo e persuasivo." },
                { icon: "📝", label: "Resumir em Tópicos", prompt: "Resuma o texto selecionado em tópicos claros e objetivos." },
                { icon: "📊", label: "Criar Tabela", prompt: "Crie uma tabela comparativa com 3 colunas e 4 linhas contendo dados estruturados." },
                { icon: "🚀", label: "Expandir Ideias", prompt: "Expanda as ideias do texto adicionando justificativas e contexto detalhado." },
                { icon: "✅", label: "Corrigir Gramática", prompt: "Corrija quaisquer erros gramaticais e de pontuação no texto." },
                { icon: "🌐", label: "Traduzir (EN)", prompt: "Traduza o texto selecionado para o Inglês mantendo o estilo profissional." },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="nexus-ai-chip"
                  onClick={() => {
                    setAiPrompt(chip.prompt);
                    void handleRunAi(chip.prompt);
                  }}
                >
                  <span>{chip.icon}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {chip.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Prompt Input Box */}
            <div className="nexus-ai-input-wrap">
              <textarea
                rows={3}
                placeholder="Ex: 'Crie uma tabela comparativa...', 'Reescreva em tom executivo...', 'Resuma este documento...'"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="nexus-ai-textarea"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleRunAi();
                  }
                }}
              />
              <div className="nexus-ai-input-hint">
                <span>Dica: Comandos em linguagem natural controlam o editor (tabelas, formatação, inserções)</span>
                <span style={{ opacity: 0.8, display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                  <CornerDownLeft className="h-3 w-3" /> Enter para executar
                </span>
              </div>
            </div>

            {/* Loading / Shimmer State */}
            {aiLoading && (
              <div className="nexus-ai-shimmer-container">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem", color: "#c084fc" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Sparkles className="h-3.5 w-3.5 animate-spin text-purple-400" />
                    <span className="font-medium">Nexus AI Copilot analisando e aplicando alterações...</span>
                  </div>
                  <span style={{ fontSize: "0.65rem", color: "#a855f7" }}>Aguardando modelo</span>
                </div>
                <div className="nexus-ai-shimmer-bar" />
              </div>
            )}

            {/* Feedback / Result message */}
            {aiMessage && (
              <div className={`nexus-ai-result-box ${aiMessage.isError ? "error" : "success"}`}>
                {aiMessage.isError ? (
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div style={{ flex: 1 }}>{aiMessage.text}</div>
              </div>
            )}

            {/* Collapsible / Fallback Settings for API Key or Local Models (Ollama, Groq, etc.) */}
            {(showAiSettings || !activeAiConfig.apiKey) && (
              <div
                style={{
                  padding: "0.65rem 0.85rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(30, 41, 59, 0.7)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  fontSize: "0.7rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 600, color: "#e2e8f0" }}>
                  <span>⚙️ Configuração de IA (OpenAI / Groq / Ollama local)</span>
                  {!activeAiConfig.apiKey && (
                    <span style={{ color: "#f59e0b", fontSize: "0.65rem" }}>Chave não detectada</span>
                  )}
                </div>
                <div style={{ color: "#94a3b8", fontSize: "0.68rem" }}>
                  Insira sua API Key ou use um modelo local gratuito via Ollama (sem custos):
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="password"
                    placeholder="Chave API (sk-... ou 'ollama')"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    className="nexus-input-field"
                    style={{
                      flex: 1,
                      backgroundColor: "rgba(15, 23, 42, 0.8)",
                      borderColor: "rgba(148, 163, 184, 0.2)",
                      color: "#f8fafc",
                      fontSize: "0.75rem",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="nexus-ai-modal-footer">
              <div style={{ fontSize: "0.68rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Bot className="h-3.5 w-3.5 text-purple-400" />
                <span>NLP Function Calling &bull; Ferramentas nativas do editor</span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="nexus-ai-btn-secondary"
                  onClick={() => setShowAiModal(false)}
                >
                  Fechar
                </button>
                <button
                  type="button"
                  className="nexus-ai-btn-primary"
                  disabled={aiLoading || !aiPrompt.trim()}
                  onClick={() => void handleRunAi()}
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  <span>{aiLoading ? "Processando..." : "Executar Copilot"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Find and Replace Modal */}
      {showSearchModal ? (
        <div className="nexus-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="nexus-modal-card w-full max-w-sm rounded-lg border border-[var(--nexus-border)] bg-[var(--nexus-surface-1)] p-4 shadow-xl space-y-3 text-xs">
            <div className="nexus-modal-header flex justify-between items-center font-semibold">
              <span>{t.searchAndReplace}</span>
              <button
                type="button"
                className="nexus-toolbar-btn text-[var(--nexus-text-muted)]"
                onClick={() => setShowSearchModal(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="nexus-input-field w-full px-2 py-1 rounded border border-[var(--nexus-border)] bg-[var(--nexus-bg)]"
            />
            <input
              type="text"
              placeholder="Substituir por..."
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              className="nexus-input-field w-full px-2 py-1 rounded border border-[var(--nexus-border)] bg-[var(--nexus-bg)]"
            />
            <div className="nexus-modal-footer flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="nexus-btn-secondary px-2 py-1 rounded border border-[var(--nexus-border)]"
                onClick={() => setShowSearchModal(false)}
              >
                Fechar
              </button>
              <button
                type="button"
                className="nexus-btn-primary px-2 py-1 rounded bg-[var(--nexus-accent)] text-white font-medium"
                onClick={() => {
                  if (!searchTerm || !editor) return;
                  const currentHtml = editor.getHTML();
                  const replaced = currentHtml.split(searchTerm).join(replaceTerm);
                  editor.commands.setContent(replaced);
                  setShowSearchModal(false);
                }}
              >
                Substituir Tudo
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Status Bar */}
      <footer className="nexus-statusbar">
        <div className="flex items-center gap-4">
          <span>
            {wordCount} {t.words}
          </span>
          <span>
            {charCount} {t.characters}
          </span>
          <span>
            ~{readingTime} {t.readingTime}
          </span>
        </div>
        <div className="text-[11px] text-[var(--nexus-text-muted)]">Nexus WYSIWYG Editor</div>
      </footer>
    </div>
    </EditorThemeContext.Provider>
  );
}

