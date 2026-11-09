import React, { useState } from "react";
import { NexusWysiwygEditor } from "../../src";

export function App() {
  const [content, setContent] = useState<string>(
    `<h1>Welcome to Nexus WYSIWYG Editor</h1>
    <p>This is a modern, enterprise-ready rich text editor inspired by TinyMCE and Google Docs, built on top of <strong>TipTap</strong>, <strong>React</strong>, and <strong>TypeScript</strong>.</p>
    <h2>Key Capabilities</h2>
    <ul>
      <li><strong>Menubar & Toolbar</strong>: Full standard file, edit, insert, view, format, and table menus.</li>
      <li><strong>Rich Formatting</strong>: Headings, alignments, tables, images, links, lists, code, and blockquotes.</li>
      <li><strong>Autonomous & Pluggable</strong>: Ready to run 100% offline or with any backend (Supabase, Firebase, S3, custom API).</li>
      <li><strong>Diff & Revisions</strong>: Built-in word-level diffing, revision history, and comments threads.</li>
    </ul>
    <h2>Try typing below:</h2>
    <p>Feel free to select text, format it, right click for context actions, or test markdown conversions.</p>`
  );

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [locale, setLocale] = useState<"pt-BR" | "en">("pt-BR");

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: theme === "dark" ? "#030712" : "#f8fafc",
        color: theme === "dark" ? "#f8fafc" : "#0f172a",
        padding: "2rem 1rem",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
              Nexus WYSIWYG Editor
            </h1>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", opacity: 0.7 }}>
              Enterprise TinyMCE-style editor for React applications.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as "pt-BR" | "en")}
              style={{
                padding: "0.35rem 0.65rem",
                borderRadius: "0.375rem",
                border: "1px solid #cbd5e1",
                fontSize: "0.75rem",
                background: theme === "dark" ? "#1e293b" : "#fff",
                color: theme === "dark" ? "#fff" : "#0f172a",
              }}
            >
              <option value="pt-BR">Português (BR)</option>
              <option value="en">English (US)</option>
            </select>

            <button
              onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "0.375rem",
                border: "1px solid #cbd5e1",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                background: theme === "dark" ? "#1e293b" : "#fff",
                color: theme === "dark" ? "#fff" : "#0f172a",
              }}
            >
              {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </button>
          </div>
        </header>

        <main>
          <NexusWysiwygEditor
            value={content}
            onChange={setContent}
            locale={locale}
            theme={theme}
            showRightPanel={true}
            storageKey="nexus-demo-editor"
            onUploadImage={async (file) => {
              // Simulated upload
              return URL.createObjectURL(file);
            }}
          />
        </main>

        <footer style={{ marginTop: "2rem", fontSize: "0.75rem", opacity: 0.6, textAlign: "center" }}>
          Published under MIT License • Ready to publish on GitHub and NPM
        </footer>
      </div>
    </div>
  );
}

