import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  CheckCircle2,
  Download,
  Eye,
  FileCheck,
  FileText,
  Languages,
  Layers,
  Lock,
  Moon,
  Sparkles,
  Sun,
  Tag,
  Unlock,
  Users,
} from "lucide-react";
import {
  LocalStorageAdapter,
  NexusWysiwygEditor,
  type EditorTemplate,
  type MentionCandidate,
  type MergeTag,
} from "../../src";

const INITIAL_DEMO_HTML = `
<h1>Nexus WYSIWYG Editor &mdash; Enterprise Suite</h1>
<p>Bem-vindo à demonstração completa do <strong>Nexus WYSIWYG Editor</strong>. Todas as funcionalidades corporativas estão habilitadas e configuradas nesta página.</p>

<blockquote style="border-left: 3px solid #2563eb; padding-left: 0.85rem; font-style: italic; background-color: rgba(37,99,235,0.08); padding: 0.5rem 0.85rem; border-radius: 0 0.25rem 0.25rem 0;">
  <strong>Destaque Corporativo:</strong> Editor avançado com suporte a IA nativa (OpenAI), formatação rica, tabelas, histórico de revisões e temas Light & Dark.
</blockquote>

<h2>1. Informações do Contrato & Tags Dinâmicas</h2>
<p>Este documento foi gerado para o cliente <span class="merge-tag">{{cliente_nome}}</span> através da organização <span class="merge-tag">{{empresa}}</span>, sob responsabilidade de <span class="merge-tag">{{responsavel}}</span> na data de <span class="merge-tag">{{data_emissao}}</span>.</p>

<h2>2. Tabela de Serviços & Entregas</h2>
<table>
  <thead>
    <tr>
      <th>Módulo</th>
      <th>Descrição</th>
      <th>Status</th>
      <th>Investimento</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Editor Core</strong></td>
      <td>TipTap StarterKit, Radix Menus, Prose styling</td>
      <td>Concluído</td>
      <td>R$ 28.500,00</td>
    </tr>
    <tr>
      <td><strong>Quality & A11y</strong></td>
      <td>Verificador WCAG, checagem de links e spellcheck</td>
      <td>Concluído</td>
      <td>R$ 16.000,00</td>
    </tr>
    <tr>
      <td><strong>Collab & Diff</strong></td>
      <td>Comentários, sugestões, histórico e word diff</td>
      <td>Ativo</td>
      <td>R$ 25.000,00</td>
    </tr>
    <tr>
      <td><strong>Pipelines</strong></td>
      <td>Export PDF/DOCX, Markdown bidirecional e tags</td>
      <td>Ativo</td>
      <td><span class="merge-tag">{{valor_total}}</span></td>
    </tr>
  </tbody>
</table>

<hr data-page-break="true" />

<h2>3. Recursos Avançados</h2>
<ul>
  <li><strong>Agente de IA Integrado:</strong> Redija textos, crie tabelas ou formate seleções utilizando linguagem natural compatível com o padrão OpenAI.</li>
  <li><strong>Word Diff & Auditoria:</strong> Compare edições palavra por palavra em relação às revisões salvas na aba lateral.</li>
  <li><strong>Tags & Templates:</strong> Resolução em tempo real de tags como <span class="merge-tag">{{email_contato}}</span> no painel Preview.</li>
  <li><strong>Offline First:</strong> Persistência local automática com adapters de armazenamento e colaboração.</li>
</ul>

<p>Clique com o <em>botão direito</em> do mouse em qualquer ponto do texto para testar o <strong>Menu de Contexto</strong> rápido.</p>
`.trim();

const DEMO_MENTIONS: MentionCandidate[] = [
  { id: "usr_alice", label: "Alice Costa", email: "alice@company.com", avatar: "👩‍💻" },
  { id: "usr_bruno", label: "Bruno Roque", email: "bruno@company.com", avatar: "👨‍💻" },
  { id: "usr_carla", label: "Carla Mendes", email: "carla@company.com", avatar: "👩‍💼" },
  { id: "usr_david", label: "David Rocha", email: "david@company.com", avatar: "👨‍🔬" },
];

const DEMO_MERGE_TAGS: MergeTag[] = [
  { id: "cliente_nome", label: "Nome do Cliente", token: "{{cliente_nome}}", sectionKey: "crm" },
  { id: "empresa", label: "Empresa Emissora", token: "{{empresa}}", sectionKey: "crm" },
  { id: "data_emissao", label: "Data de Emissão", token: "{{data_emissao}}", sectionKey: "geral" },
  { id: "responsavel", label: "Responsável Técnico", token: "{{responsavel}}", sectionKey: "geral" },
  { id: "valor_total", label: "Valor Total", token: "{{valor_total}}", sectionKey: "financeiro" },
  { id: "email_contato", label: "E-mail de Contato", token: "{{email_contato}}", sectionKey: "crm" },
];

const DEMO_TEMPLATES: EditorTemplate[] = [
  {
    id: "relatorio-executivo",
    label: "Relatório Executivo",
    sectionKey: "corporativo",
    html: `
      <h1>Relatório Executivo &mdash; {{empresa}}</h1>
      <p>Data: {{data_emissao}} | Responsável: {{responsavel}}</p>
      <h2>Sumário Executivo</h2>
      <p>Este documento consolida os resultados e objetivos estratégicos do trimestre para o cliente {{cliente_nome}}.</p>
      <h2>Principais Métricas</h2>
      <ul>
        <li>Disponibilidade do Sistema: 99.98%</li>
        <li>Satisfação do Cliente (CSAT): 4.9/5</li>
        <li>Valor total gerenciado: {{valor_total}}</li>
      </ul>
      <h2>Próximos Passos</h2>
      <p>Aprovação das diretrizes e início da fase 2.</p>
    `.trim(),
  },
  {
    id: "proposta-comercial",
    label: "Proposta Comercial",
    sectionKey: "vendas",
    html: `
      <h1>Proposta Comercial de Prestação de Serviços</h1>
      <p>Preparado especialmente para: <strong>{{cliente_nome}}</strong></p>
      <p>Emissão: {{data_emissao}} | Contato: {{email_contato}}</p>
      <h2>Escopo do Projeto</h2>
      <p>Fornecimento de licença enterprise e suporte de engenharia para o Nexus WYSIWYG Editor.</p>
      <h2>Valores</h2>
      <p>Investimento Global: <strong>{{valor_total}}</strong></p>
      <p>Validade da proposta: 30 dias corridos.</p>
    `.trim(),
  },
  {
    id: "especificacao-tecnica",
    label: "Especificação Técnica",
    sectionKey: "engenharia",
    html: `
      <h1>Especificação de Arquitetura de Software</h1>
      <p>Autor: {{responsavel}} | Data: {{data_emissao}}</p>
      <h2>Visão Geral da Solução</h2>
      <p>Integração autônoma do editor de texto com suporte offline-first, pipeline de sanitização DOMPurify e renderização SSR/Client.</p>
      <h2>Requisitos Não-Funcionais</h2>
      <ul>
        <li>Zero dependência externa obrigatória no bundle final</li>
        <li>Conformidade de acessibilidade nível WCAG AA</li>
        <li>Integração com Agente de IA para suporte à redação e formatação via NLP</li>
      </ul>
    `.trim(),
  },
];

export function App() {
  const [content, setContent] = useState<string>(INITIAL_DEMO_HTML);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [locale, setLocale] = useState<"pt-BR" | "en">("pt-BR");
  const [readOnly, setReadOnly] = useState<boolean>(false);
  const [showRightPanel, setShowRightPanel] = useState<boolean>(true);

  // Live editable Merge Tag Values
  const [tagValues, setTagValues] = useState<Record<string, string>>({
    cliente_nome: "Acme Corporation Inc.",
    empresa: "Nexus Enterprise Tech",
    data_emissao: new Date().toLocaleDateString("pt-BR"),
    responsavel: "Bruno Roque",
    valor_total: "R$ 69.500,00",
    email_contato: "contato@nexus-editor.dev",
  });

  const [metricsLog, setMetricsLog] = useState<Array<{ id: string; time: string; name: string }>>([]);
  const [showTagInspector, setShowTagInspector] = useState(false);
  const [showMetricsDrawer, setShowMetricsDrawer] = useState(false);

  // OpenAI Agent Configuration
  const [openAiKey, setOpenAiKey] = useState<string>(
    // @ts-ignore
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_OPENAI_API_KEY) || ""
  );
  const [openAiModel, setOpenAiModel] = useState<string>(
    // @ts-ignore
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_OPENAI_MODEL) || "gpt-4o-mini"
  );
  const [openAiBaseUrl, setOpenAiBaseUrl] = useState<string>(
    // @ts-ignore
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_OPENAI_BASE_URL) || "https://api.openai.com/v1"
  );
  const [showAiConfig, setShowAiConfig] = useState(false);

  const storageKey = "nexus-demo-editor-v2";
  const storageAdapter = useMemo(() => new LocalStorageAdapter(), []);

  // Pre-seed initial revision snapshot and sample comment/suggestion if empty
  useEffect(() => {
    void (async () => {
      const bundle = await storageAdapter.loadBundle(storageKey);
      if (bundle.revisions.length === 0) {
        await storageAdapter.insertRevision(storageKey, {
          id: `rev-${Date.now()}`,
          authorId: "usr_alice",
          label: "Versão 1.0 (Baseline)",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          html: INITIAL_DEMO_HTML,
        });
      }
      if (bundle.comments.length === 0) {
        await storageAdapter.insertComment(storageKey, {
          id: `comment-${Date.now()}`,
          authorId: "usr_carla",
          from: 0,
          to: 28,
          quote: "Nexus WYSIWYG Editor",
          message: "Excelente estrutura corporativa! A arquitetura do editor atende perfeitamente aos requisitos de acessibilidade e produtividade com IA.",
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          status: "open",
          replies: [],
        });
      }
      if (bundle.suggestions.length === 0) {
        await storageAdapter.insertSuggestion(storageKey, {
          id: `sug-${Date.now()}`,
          authorId: "usr_bob",
          from: 50,
          to: 80,
          originalText: "funcionalidades corporativas",
          proposedText: "capacidades enterprise e qualidade editorial",
          createdAt: new Date(Date.now() - 900000).toISOString(),
          status: "pending",
        });
      }
      await storageAdapter.logEntry({
        storageKey,
        actorId: "system",
        action: "demo_initialized",
        detail: "Demonstração corporativa carregada com todas as features ativas.",
      });
    })();
  }, [storageAdapter, storageKey]);

  const handleMetric = (name: string) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: new Date().toLocaleTimeString(),
      name,
    };
    setMetricsLog((prev) => [entry, ...prev.slice(0, 30)]);
  };

  const handleSimulatedExport = (format: "pdf" | "docx", html: string) => {
    const blob = new Blob([html], { type: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `documento-exportado.${format}`;
    link.click();
    handleMetric(`export_${format}`);
  };

  return (
    <div
      className={theme === "dark" ? "dark" : ""}
      style={{
        minHeight: "100vh",
        backgroundColor: theme === "dark" ? "#030712" : "#f1f5f9",
        color: theme === "dark" ? "#f9fafb" : "#0f172a",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        padding: "1.5rem 1rem",
        transition: "background-color 0.2s ease, color 0.2s ease",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* Top Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1rem",
            padding: "1rem 1.25rem",
            backgroundColor: theme === "dark" ? "#111827" : "#ffffff",
            borderRadius: "0.75rem",
            border: `1px solid ${theme === "dark" ? "#1f2937" : "#e2e8f0"}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "0.5rem",
                backgroundColor: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1.25rem",
              }}
            >
              N
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
                  Nexus WYSIWYG Editor
                </h1>
                <span
                  style={{
                    backgroundColor: "#10b98120",
                    color: "#10b981",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    padding: "0.15rem 0.45rem",
                    borderRadius: "0.25rem",
                  }}
                >
                  Enterprise Suite v1.0
                </span>
              </div>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.8rem", opacity: 0.75 }}>
                TinyMCE-style rich text architecture para React, TipTap, Radix UI & TypeScript.
              </p>
            </div>
          </div>

          {/* Quick Controls Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* Quick Template Switchers */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, opacity: 0.7 }}>
                Templates:
              </span>
              {DEMO_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setContent(tpl.html)}
                  style={{
                    padding: "0.3rem 0.6rem",
                    borderRadius: "0.375rem",
                    fontSize: "0.75rem",
                    border: `1px solid ${theme === "dark" ? "#374151" : "#cbd5e1"}`,
                    backgroundColor: theme === "dark" ? "#1f2937" : "#f8fafc",
                    color: theme === "dark" ? "#f9fafb" : "#0f172a",
                    cursor: "pointer",
                  }}
                  title={`Carregar template: ${tpl.label}`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            <div
              style={{
                width: "1px",
                height: "1.5rem",
                backgroundColor: theme === "dark" ? "#374151" : "#e2e8f0",
                margin: "0 0.25rem",
              }}
            />

            {/* Read-Only toggle */}
            <button
              type="button"
              onClick={() => setReadOnly((prev) => !prev)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.65rem",
                borderRadius: "0.375rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                border: `1px solid ${readOnly ? "#f59e0b" : theme === "dark" ? "#374151" : "#cbd5e1"}`,
                backgroundColor: readOnly
                  ? "rgba(245, 158, 11, 0.15)"
                  : theme === "dark"
                  ? "#1f2937"
                  : "#ffffff",
                color: readOnly ? "#d97706" : theme === "dark" ? "#ffffff" : "#0f172a",
                cursor: "pointer",
              }}
            >
              {readOnly ? <Lock size={13} /> : <Unlock size={13} />}
              {readOnly ? "Modo Leitura" : "Edição Ativa"}
            </button>

            {/* Locale selector */}
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as "pt-BR" | "en")}
              style={{
                padding: "0.35rem 0.5rem",
                borderRadius: "0.375rem",
                fontSize: "0.75rem",
                border: `1px solid ${theme === "dark" ? "#374151" : "#cbd5e1"}`,
                backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                color: theme === "dark" ? "#ffffff" : "#0f172a",
                cursor: "pointer",
              }}
            >
              <option value="pt-BR">🇧🇷 Português</option>
              <option value="en">🇺🇸 English</option>
            </select>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "0.375rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                border: `1px solid ${theme === "dark" ? "#374151" : "#cbd5e1"}`,
                backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                color: theme === "dark" ? "#ffffff" : "#0f172a",
              }}
            >
              {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </button>
          </div>
        </header>

        {/* Feature Badges Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginBottom: "1rem",
            padding: "0.6rem 1rem",
            borderRadius: "0.5rem",
            backgroundColor: theme === "dark" ? "#111827" : "#ffffff",
            border: `1px solid ${theme === "dark" ? "#1f2937" : "#e2e8f0"}`,
            fontSize: "0.75rem",
          }}
        >
          <span style={{ fontWeight: 700, color: "#2563eb", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <Sparkles size={14} /> Features Ativas:
          </span>
          {[
            "Menubar Completo (TinyMCE)",
            "Agente de IA (OpenAI NLP)",
            "Menu de Contexto (Botão Direito)",
            "Word Diff em Tempo Real",
            "Tags & Resolução Dinâmica",
            "Acessibilidade & WCAG",
            "Spellcheck & Links",
            "Upload de Imagens",
            "Tabelas com Alinhamento",
            "Histórico de Revisões",
            "Trilhas de Auditoria",
            "Export PDF / DOCX / MD",
          ].map((feat, idx) => (
            <span
              key={idx}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.2rem 0.5rem",
                borderRadius: "0.25rem",
                backgroundColor: theme === "dark" ? "#1e293b" : "#f1f5f9",
                color: theme === "dark" ? "#93c5fd" : "#1e40af",
                fontWeight: 500,
              }}
            >
              <CheckCircle2 size={12} color="#10b981" />
              {feat}
            </span>
          ))}
        </div>

        {/* Action Toggles for Tag Inspector and Telemetry */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setShowTagInspector((prev) => !prev)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.65rem",
                borderRadius: "0.375rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                border: `1px solid ${showTagInspector ? "#2563eb" : theme === "dark" ? "#374151" : "#cbd5e1"}`,
                backgroundColor: showTagInspector ? "rgba(37,99,235,0.15)" : theme === "dark" ? "#111827" : "#ffffff",
                color: showTagInspector ? "#2563eb" : theme === "dark" ? "#f9fafb" : "#0f172a",
                cursor: "pointer",
              }}
            >
              <Tag size={13} />
              {showTagInspector ? "Ocultar Valores de Tags" : "Inspecionar & Editar Tags"}
            </button>

            <button
              type="button"
              onClick={() => setShowMetricsDrawer((prev) => !prev)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.65rem",
                borderRadius: "0.375rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                border: `1px solid ${showMetricsDrawer ? "#10b981" : theme === "dark" ? "#374151" : "#cbd5e1"}`,
                backgroundColor: showMetricsDrawer ? "rgba(16,185,129,0.15)" : theme === "dark" ? "#111827" : "#ffffff",
                color: showMetricsDrawer ? "#10b981" : theme === "dark" ? "#f9fafb" : "#0f172a",
                cursor: "pointer",
              }}
            >
              <Activity size={13} />
              {showMetricsDrawer ? "Ocultar Telemetria" : `Telemetria (${metricsLog.length} eventos)`}
            </button>

            <button
              type="button"
              onClick={() => setShowAiConfig((prev) => !prev)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.65rem",
                borderRadius: "0.375rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                border: `1px solid ${showAiConfig ? "#a855f7" : theme === "dark" ? "#374151" : "#cbd5e1"}`,
                backgroundColor: showAiConfig ? "rgba(168,85,247,0.15)" : theme === "dark" ? "#111827" : "#ffffff",
                color: showAiConfig ? "#a855f7" : theme === "dark" ? "#f9fafb" : "#0f172a",
                cursor: "pointer",
              }}
            >
              <Bot size={13} />
              {showAiConfig ? "Ocultar Config IA" : `Configurar IA (${openAiModel})`}
            </button>
          </div>

          <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>
            💡 Dica: Experimente o botão <strong>IA</strong> na barra de ferramentas ou clique com o botão direito para ações rápidas.
          </div>
        </div>

        {/* Optional Tag Values Editor Card */}
        {showTagInspector && (
          <div
            style={{
              padding: "1rem",
              borderRadius: "0.5rem",
              marginBottom: "1rem",
              backgroundColor: theme === "dark" ? "#111827" : "#ffffff",
              border: `1px solid ${theme === "dark" ? "#1f2937" : "#e2e8f0"}`,
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ fontSize: "0.85rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
              Valores das Merge Tags (Atualização Dinâmica no Preview)
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {Object.entries(tagValues).map(([key, val]) => (
                <div key={key}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      opacity: 0.8,
                      marginBottom: "0.2rem",
                    }}
                  >
                    {`{{${key}}}`}
                  </label>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) =>
                      setTagValues((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "0.35rem 0.5rem",
                      borderRadius: "0.25rem",
                      border: `1px solid ${theme === "dark" ? "#374151" : "#cbd5e1"}`,
                      backgroundColor: theme === "dark" ? "#1f2937" : "#f8fafc",
                      color: theme === "dark" ? "#f9fafb" : "#0f172a",
                      fontSize: "0.75rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OpenAI Agent Configuration Card */}
        {showAiConfig && (
          <div
            style={{
              padding: "1rem",
              borderRadius: "0.5rem",
              marginBottom: "1rem",
              backgroundColor: theme === "dark" ? "#111827" : "#ffffff",
              border: `1px solid ${theme === "dark" ? "#1f2937" : "#e2e8f0"}`,
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.35rem", color: "#a855f7" }}>
                <Bot size={15} />
                Agente de IA Integrado (Padrão OpenAI)
              </h3>
              <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>
                Variáveis: <code>VITE_OPENAI_API_KEY</code>, <code>VITE_OPENAI_BASE_URL</code>, <code>VITE_OPENAI_MODEL</code>
              </span>
            </div>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", opacity: 0.8 }}>
              Configure as variáveis no seu <code>.env</code> ou ajuste os parâmetros abaixo. Qualquer modelo compatível com OpenAI (OpenAI, Azure, Groq, Ollama, OpenRouter, vLLM) é suportado.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, opacity: 0.8, marginBottom: "0.2rem" }}>
                  Chave de API (VITE_OPENAI_API_KEY)
                </label>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={openAiKey}
                  onChange={(e) => setOpenAiKey(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.35rem 0.5rem",
                    borderRadius: "0.25rem",
                    border: `1px solid ${theme === "dark" ? "#374151" : "#cbd5e1"}`,
                    backgroundColor: theme === "dark" ? "#1f2937" : "#f8fafc",
                    color: theme === "dark" ? "#f9fafb" : "#0f172a",
                    fontSize: "0.75rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, opacity: 0.8, marginBottom: "0.2rem" }}>
                  Modelo (VITE_OPENAI_MODEL)
                </label>
                <input
                  type="text"
                  placeholder="gpt-4o-mini"
                  value={openAiModel}
                  onChange={(e) => setOpenAiModel(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.35rem 0.5rem",
                    borderRadius: "0.25rem",
                    border: `1px solid ${theme === "dark" ? "#374151" : "#cbd5e1"}`,
                    backgroundColor: theme === "dark" ? "#1f2937" : "#f8fafc",
                    color: theme === "dark" ? "#f9fafb" : "#0f172a",
                    fontSize: "0.75rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, opacity: 0.8, marginBottom: "0.2rem" }}>
                  Base URL (VITE_OPENAI_BASE_URL)
                </label>
                <input
                  type="text"
                  placeholder="https://api.openai.com/v1"
                  value={openAiBaseUrl}
                  onChange={(e) => setOpenAiBaseUrl(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.35rem 0.5rem",
                    borderRadius: "0.25rem",
                    border: `1px solid ${theme === "dark" ? "#374151" : "#cbd5e1"}`,
                    backgroundColor: theme === "dark" ? "#1f2937" : "#f8fafc",
                    color: theme === "dark" ? "#f9fafb" : "#0f172a",
                    fontSize: "0.75rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Optional Live Telemetry Drawer */}
        {showMetricsDrawer && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              marginBottom: "1rem",
              backgroundColor: theme === "dark" ? "#0f172a" : "#1e293b",
              color: "#f8fafc",
              fontSize: "0.75rem",
              maxHeight: "150px",
              overflowY: "auto",
              fontFamily: "monospace",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem", fontWeight: 700 }}>
              <span>Eventos de Telemetria (Live onMetric Stream)</span>
              <button
                type="button"
                onClick={() => setMetricsLog([])}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.7rem" }}
              >
                Limpar
              </button>
            </div>
            {metricsLog.length === 0 ? (
              <span style={{ opacity: 0.5 }}>Interaja com o editor para visualizar comandos emitidos.</span>
            ) : (
              metricsLog.map((m) => (
                <div key={m.id} style={{ display: "flex", gap: "1rem", opacity: 0.9 }}>
                  <span style={{ color: "#60a5fa" }}>[{m.time}]</span>
                  <span>{m.name}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Main WYSIWYG Editor Instance */}
        <main>
          <NexusWysiwygEditor
            value={content}
            onChange={setContent}
            locale={locale}
            theme={theme}
            readOnly={readOnly}
            showRightPanel={showRightPanel}
            storageKey={storageKey}
            storageAdapter={storageAdapter}
            collaborationAdapter={storageAdapter}
            templateAdapter={storageAdapter}
            auditAdapter={storageAdapter}
            templates={DEMO_TEMPLATES}
            mergeTags={DEMO_MERGE_TAGS}
            mergeTagValues={tagValues}
            mentionCandidates={DEMO_MENTIONS}
            aiConfig={{
              apiKey: openAiKey,
              model: openAiModel,
              baseUrl: openAiBaseUrl,
            }}
            onAiAction={(res) => {
              handleMetric(`ai_action:${res.toolUsed || "generated_text"}`);
            }}
            onMetric={handleMetric}
            onExport={handleSimulatedExport}
            onUploadImage={async (file) => {
              handleMetric("image_upload_start");
              // Simulated upload with instant preview URL
              return new Promise((resolve) => {
                setTimeout(() => {
                  const url = URL.createObjectURL(file);
                  handleMetric("image_upload_success");
                  resolve(url);
                }, 400);
              });
            }}
          />
        </main>

        <footer
          style={{
            marginTop: "1.5rem",
            padding: "1rem 0",
            borderTop: `1px solid ${theme === "dark" ? "#1f2937" : "#e2e8f0"}`,
            fontSize: "0.75rem",
            opacity: 0.7,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <div>
            Nexus WYSIWYG Editor &bull; Licenciado sob MIT &bull; Pronto para produção no NPM e GitHub
          </div>
          <div>
            Desenvolvido por Bruno Roque &bull; Suporte React 18 e 19
          </div>
        </footer>
      </div>
    </div>
  );
}
