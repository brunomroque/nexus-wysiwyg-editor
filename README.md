<p align="center">
  <img src="./assets/nexus-logo.svg" alt="Nexus Editor Logo" width="460" />
</p>

<p align="center">
  <strong>Enterprise-grade, AI-Native WYSIWYG Editor for React</strong><br />
  <em>Built on TipTap, Radix UI &amp; TypeScript &bull; Free, Open Source, Zero Paywalls</em>
</p>

---

## ✨ Features

- 🤖 **AI Copilot & NLP Agent**: Native integration with OpenAI-compatible models (OpenAI, Azure, Groq, Ollama, OpenRouter, vLLM). Write, rewrite, summarize, create tables, and control editor features via Natural Language prompts and function calling.
- 🏛️ **Classic Menubar & Modern Toolbar**: File, Edit, Insert, Format, Table, Tools, Comments, and AI menus inspired by TinyMCE and Google Docs.
- 📝 **Rich Text Formatting**: Headings (H1-H3), Bold, Italic, Underline, Bullet/Numbered Lists, Blockquotes, Alignments (Left, Center, Right, Justify).
- 📊 **Advanced Table Editing**: Interactive table grid, add/delete rows and columns, header cells toggle, and cell merging.
- 🖼️ **Image & Link Management**: Direct URL insertion, file upload adapter hook, and safe link validation.
- 🔄 **Bidirectional Markdown Conversion**: Convert HTML to Markdown or Markdown to HTML in real-time.
- 📑 **Structured Document Features**:
  - Automatic Table of Contents (TOC) generation.
  - Page breaks with visual indicators.
  - Footnotes and annotations.
  - Merge Tags / Placeholders (`{{date}}`, `{{author}}`, etc.).
- 🔍 **Find & Replace**: Modal for searching terms and batch replacements.
- 👥 **Collaboration Ready**:
  - Comment threads anchored to text selections.
  - Suggested edits (track changes / revisions).
  - Word-level Diff comparison between revisions.
- ♿ **Quality & Compliance Engines**:
  - Automated Accessibility (a11y) hierarchy audits and image alt checks.
  - Link health & security checks.
  - Spellchecker heuristics.
- 🔌 **Pluggable Architecture (Adapter Pattern)**:
  - Runs **100% standalone** out-of-the-box with LocalStorage/in-memory adapter.
  - Ready-made **Supabase Adapter** for instant Postgres backend integration.
  - Easily connect to Firebase, AWS S3, Cloudinary, or your custom REST/GraphQL API.
- 🌐 **Native i18n**: Built-in support for Portuguese (`pt-BR`) and English (`en`), with custom dictionary overrides.
- 🌓 **Themes**: Native Dark and Light mode support via CSS variables.

---

## 📦 Installation

```bash
npm install nexus-wysiwyg-editor
# or
yarn add nexus-wysiwyg-editor
# or
pnpm add nexus-wysiwyg-editor
```

### Peer Dependencies

Ensure your project has `react` and `react-dom` installed:

```bash
npm install react react-dom
```

---

## 🚀 Quick Start

Import the component and its stylesheet:

```tsx
import React, { useState } from "react";
import { NexusWysiwygEditor } from "nexus-wysiwyg-editor";
import "nexus-wysiwyg-editor/style.css";

export function DocumentEditor() {
  const [content, setContent] = useState("<p>Hello from Nexus Editor!</p>");

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto" }}>
      <NexusWysiwygEditor
        value={content}
        onChange={setContent}
        placeholder="Start writing your document..."
        locale="pt-BR" // or "en"
        theme="light"  // or "dark"
      />
    </div>
  );
}
```

---

## 🛠️ Advanced Usage

### 1. Custom Image Upload (S3 / Cloudinary / Custom Backend)

Provide an `onUploadImage` callback that returns the public image URL:

```tsx
<NexusWysiwygEditor
  value={content}
  onChange={setContent}
  onUploadImage={async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: formData });
    const data = await res.json();
    return data.url;
  }}
/>
```

### 2. Connecting with Supabase (Optional Adapter)

If your app uses Supabase, plug in the provided Supabase adapter:

```tsx
import { NexusWysiwygEditor, createSupabaseAdapter } from "nexus-wysiwyg-editor";
import { supabase } from "./supabaseClient";

const supabaseAdapter = createSupabaseAdapter({
  supabaseClient: supabase,
  tenantId: "my-tenant-id", // optional multi-tenant scoping
});

<NexusWysiwygEditor
  storageKey="document-123"
  collaborationAdapter={supabaseAdapter}
  templateAdapter={supabaseAdapter}
  auditAdapter={supabaseAdapter}
/>
```

### 3. AI Agent & NLP Integration (OpenAI Standard)

Nexus WYSIWYG Editor features a built-in AI Copilot compatible with the **OpenAI Chat Completions API standard** (works out-of-the-box with OpenAI, Azure, Groq, Ollama, OpenRouter, vLLM, and LM Studio).

#### A. Configure via Environment Variables

In your Vite / Next.js / React application, create or update your `.env` file:

```env
# OpenAI API Key (or key from any OpenAI-compatible provider)
VITE_OPENAI_API_KEY=sk-your-openai-key-here

# Base URL (default: https://api.openai.com/v1)
VITE_OPENAI_BASE_URL=https://api.openai.com/v1

# Model (default: gpt-4o-mini)
VITE_OPENAI_MODEL=gpt-4o-mini
```

> **Note:** For Node/Next.js/CRA setups, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, and `OPENAI_MODEL` in `process.env` are also automatically detected as fallbacks.

#### B. Configure via Component Props

You can also pass or override settings directly in the component:

```tsx
<NexusWysiwygEditor
  value={content}
  onChange={setContent}
  aiConfig={{
    apiKey: "sk-...",
    baseUrl: "https://api.openai.com/v1", // or "https://api.groq.com/openai/v1" or "http://localhost:11434/v1"
    model: "gpt-4o-mini",
  }}
  onAiAction={(result) => {
    console.log("AI Tool executed:", result.toolUsed, result.message);
  }}
/>
```

The AI model automatically uses OpenAI Function Calling to perform actions such as:
- `insert_content`: Generates and inserts formatted text/HTML.
- `create_table`: Creates structured tables from prompt instructions (e.g. *"Create a 3x3 table with pricing plans"*).
- `format_selection`: Applies formatting (bold, italic, alignments, lists) via natural language.
- `replace_selection`: Rewrites, expands, or summarizes selected text.
- `insert_merge_tag`: Inserts dynamic tags (e.g. `{{cliente_nome}}`).

### 4. Dynamic Merge Tags & Templates

```tsx
<NexusWysiwygEditor
  mergeTagValues={{
    author_name: "John Doe",
    date: new Date().toLocaleDateString(),
    project_title: "Nexus System",
  }}
  templates={[
    {
      id: "meeting-minutes",
      label: "Meeting Minutes",
      html: "<h1>Meeting Notes</h1><p>Date: {{date}}</p>",
    },
  ]}
/>
```

---

## ⚙️ Component Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `string` | `undefined` | Controlled HTML content of the editor. |
| `defaultValue` | `string` | `INITIAL_HTML` | Initial content for uncontrolled mode. |
| `onChange` | `(html: string) => void` | `undefined` | Callback fired on editor content change. |
| `readOnly` | `boolean` | `false` | Disables editing when `true`. |
| `placeholder` | `string` | Localized default | Placeholder shown when editor is empty. |
| `storageKey` | `string` | `"nexus-wysiwyg-draft"` | Key used for autosaving document drafts. |
| `autoSave` | `boolean` | `true` | Enables automatic local debounced draft saving. |
| `locale` | `"pt-BR" \| "en" \| string` | `"pt-BR"` | UI language for menus, tooltips, and dialogs. |
| `translations` | `Partial<EditorTranslations>` | `undefined` | Custom label and text overrides. |
| `theme` | `"light" \| "dark" \| "auto"` | `"auto"` | Color theme mode. |
| `showRightPanel` | `boolean` | `false` | Whether to show the side inspection/comments drawer. |
| `currentUserId` | `string` | `"user-1"` | Active user ID for comments and revisions. |
| `mentionCandidates` | `MentionCandidate[]` | `[]` | List of user handles for `@mention` auto-completion. |
| `onUploadImage` | `(file: File) => Promise<string>` | `undefined` | Custom image uploader handler. |
| `onExport` | `(format: "pdf" \| "docx", html: string) => void` | `undefined` | Custom export handler. |
| `collaborationAdapter` | `CollaborationAdapter` | `defaultStorageAdapter` | Adapter for comments, revisions, and suggestions. |

---

## 💖 Sponsoring & Donations / Apoie o Projeto

Nexus WYSIWYG Editor is an open-source project distributed under the MIT license. If this component saves you or your company development time, or if you use it in **commercial applications and enterprise SaaS**, please consider supporting its ongoing development and maintenance!

> *"Se o Nexus WYSIWYG Editor agregou valor ao seu negócio ou facilitou o seu desenvolvimento, considere apoiar o projeto com uma doação ou patrocínio!"*

### International Supporters (Global)
- ☕ **Buy Me a Coffee**: [buymeacoffee.com/brunomroque](https://buymeacoffee.com/brunomroque)
- 🪙 **Ko-fi**: [ko-fi.com/brunomroque](https://ko-fi.com/brunomroque)
- 💖 **GitHub Sponsors**: [github.com/sponsors/brunomroque](https://github.com/sponsors/brunomroque)

### Brasil (Pix)
Você pode enviar qualquer valor diretamente via **Pix** utilizando a chave aleatória abaixo:

```text
6273ae2e-7345-405b-873c-6749946c8488
```

---

## 💻 Development & Demo

Run the demo app locally:

```bash
# Clone the repository
git clone https://github.com/brunomroque/nexus-wysiwyg-editor.git
cd nexus-wysiwyg-editor

# Install dependencies and build
npm install
npm run build

# Start the interactive playground
npm run demo
```

---

## 📄 License

[MIT](LICENSE) © Bruno Roque & Nexus Contributors

