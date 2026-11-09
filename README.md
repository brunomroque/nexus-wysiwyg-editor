# 🌟 Nexus WYSIWYG Editor

An enterprise-grade, **TinyMCE-style WYSIWYG Editor** built on top of **React**, **TipTap**, **Radix UI**, and **TypeScript**. 

Designed for mission-critical web applications requiring rich document authoring, formatting, revision histories, compliance checks, and seamless offline or cloud persistence.

---

## ✨ Features

- 🏛️ **Classic Menubar & Modern Toolbar**: File, Edit, Insert, View, Tools, and Comments menus inspired by TinyMCE and Google Docs.
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

### 3. Dynamic Merge Tags & Templates

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

## 💻 Development & Demo

Run the demo app locally:

```bash
# Clone the repository
git clone https://github.com/your-username/nexus-wysiwyg-editor.git
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

