import { useState } from "react";

type Theme = {
  id: string;
  number: string;
  name: string;
  audience: string;
  className: string;
  colors: { name: string; value: string }[];
  fonts: string[];
  radii: string[];
};

const themes: Theme[] = [
  {
    id: "obsidian",
    number: "01",
    name: "Linear Obsidian",
    audience: "Developer & Hacker Docs",
    className: "theme-obsidian",
    colors: [
      { name: "Void", value: "#0B0F17" },
      { name: "Surface", value: "#131B2E" },
      { name: "Border", value: "#222F49" },
      { name: "Violet", value: "#8B5CF6" },
      { name: "Cyan", value: "#06B6D4" },
    ],
    fonts: ["Inter / UI", "JetBrains Mono / Code"],
    radii: ["4", "8", "12"],
  },
  {
    id: "editorial",
    number: "02",
    name: "Editorial Paper & Ink",
    audience: "Publishers & Long-form",
    className: "theme-editorial",
    colors: [
      { name: "Paper", value: "#FAF8F5" },
      { name: "Card", value: "#F3EFEA" },
      { name: "Charcoal", value: "#292524" },
      { name: "Terracotta", value: "#C2410C" },
      { name: "Amber", value: "#D97706" },
    ],
    fonts: ["DM Sans / UI", "Merriweather / Reading"],
    radii: ["2", "6", "10"],
  },
  {
    id: "glass",
    number: "03",
    name: "Neo-Glass Enterprise",
    audience: "Executive SaaS",
    className: "theme-glass",
    colors: [
      { name: "Ice", value: "#EEF5FF" },
      { name: "Glass", value: "#FFFFFFB8" },
      { name: "Slate", value: "#172554" },
      { name: "Electric", value: "#2563EB" },
      { name: "Aura", value: "#A5B4FC" },
    ],
    fonts: ["Plus Jakarta Sans / UI", "Plus Jakarta Sans / Reading"],
    radii: ["8", "12", "16"],
  },
  {
    id: "playful",
    number: "04",
    name: "Playful Creative Multiplayer",
    audience: "Creative Teams",
    className: "theme-playful",
    colors: [
      { name: "Canvas", value: "#FFFFFF" },
      { name: "Lavender", value: "#F1ECFF" },
      { name: "Mint", value: "#DCFCE7" },
      { name: "Coral", value: "#FF5733" },
      { name: "Indigo", value: "#4F46E5" },
    ],
    fonts: ["DM Sans / UI", "DM Sans / Reading"],
    radii: ["12", "18", "999"],
  },
];

const iconPaths: Record<string, React.ReactNode> = {
  undo: <path d="M9 7 5 11l4 4M5 11h8a5 5 0 0 1 5 5" />,
  redo: <path d="m15 7 4 4-4 4m4-4h-8a5 5 0 0 0-5 5" />,
  chevron: <path d="m7 10 5 5 5-5" />,
  link: (
    <>
      <path d="m10 13 4-4" />
      <path
        d="M7.5 15.5 5 18a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0M16.5 8.5 19 6a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0"
        transform="scale(.75) translate(3 3)"
      />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m21 15-5-5L5 20" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M9 4v16" />
    </>
  ),
  code: <path d="m8 9-3 3 3 3m8-6 3 3-3 3m-3-9-2 12" />,
  align: <path d="M4 6h16M4 10h11M4 14h16M4 18h9" />,
  list: <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />,
  comment: <path d="M20 15a3 3 0 0 1-3 3H9l-5 3V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3Z" />,
  sparkle: (
    <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2ZM18 14l.7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7Z" />
  ),
  accessibility: (
    <>
      <circle cx="12" cy="4" r="2" />
      <path d="M5 8h14M12 6v7m0 0-4 8m4-8 4 8" />
    </>
  ),
  send: <path d="m4 4 17 8-17 8 3-8Zm3 8h14" />,
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
  fullscreen: <path d="M8 3H3v5m13-5h5v5M8 21H3v-5m13 5h5v-5" />,
  cloud: <path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9a4.5 4.5 0 0 0 1 9Zm2-5 2 2 4-4" />,
};

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}

function IconButton({ icon, label, state = "" }: { icon: string; label: string; state?: string }) {
  return (
    <button className={`icon-button ${state}`} aria-label={label} title={label}>
      <Icon name={icon} />
    </button>
  );
}

function Toolbar({ themeId }: { themeId: string }) {
  const [bold, setBold] = useState(true);
  return (
    <div className="toolbar">
      <div className="toolbar-group history">
        <IconButton icon="undo" label="Desfazer" />
        <IconButton icon="redo" label="Refazer" state="disabled" />
      </div>
      <div className="toolbar-divider" />
      <button className="select-button">
        Normal <Icon name="chevron" size={13} />
      </button>
      <button className="select-button font-select">
        {themeId === "obsidian"
          ? "Inter"
          : themeId === "editorial"
            ? "Merriweather"
            : themeId === "glass"
              ? "Jakarta Sans"
              : "DM Sans"}{" "}
        <Icon name="chevron" size={13} />
      </button>
      <button className="select-button size-select">
        16 <Icon name="chevron" size={13} />
      </button>
      <div className="toolbar-divider" />
      <button
        className={`type-button ${bold ? "active" : ""}`}
        onClick={() => setBold(!bold)}
        aria-label="Negrito"
      >
        <strong>B</strong>
      </button>
      <button className="type-button" aria-label="Itálico">
        <em>I</em>
      </button>
      <button className="type-button hover-demo" aria-label="Sublinhado">
        <u>U</u>
      </button>
      <button className="color-button" aria-label="Cor do texto">
        A<span />
      </button>
      <button className="highlight-button" aria-label="Marca-texto">
        <span>ab</span>
      </button>
      <div className="toolbar-divider" />
      <IconButton icon="align" label="Alinhamento" />
      <IconButton icon="list" label="Lista" />
      <div className="toolbar-divider" />
      <IconButton icon="table" label="Tabela" />
      <IconButton icon="link" label="Link" />
      <IconButton icon="image" label="Imagem" />
      <IconButton icon="code" label="Código" />
      <div className="toolbar-divider" />
      <IconButton icon="accessibility" label="Auditoria de acessibilidade" />
      <button className="merge-button" title="Mala direta">
        {"{{ }}"}
      </button>
      <button className="copilot-button">
        <Icon name="sparkle" /> AI Copilot <kbd>⌘ K</kbd>
      </button>
    </div>
  );
}

function BubbleMenu() {
  return (
    <div className="bubble-menu">
      <button>
        <strong>B</strong>
      </button>
      <button>
        <em>I</em>
      </button>
      <button>
        <u>U</u>
      </button>
      <span />
      <button>
        <Icon name="link" size={14} />
      </button>
      <button>
        <Icon name="comment" size={14} />
      </button>
      <span />
      <button className="improve">
        <Icon name="sparkle" size={14} /> Melhorar com IA
      </button>
    </div>
  );
}

function Document({ themeId }: { themeId: string }) {
  return (
    <div className="workspace">
      {themeId === "playful" && (
        <>
          <div className="cursor cursor-lia">
            <span>Lia</span>
          </div>
          <div className="cursor cursor-noah">
            <span>Noah</span>
          </div>
        </>
      )}
      <article className="document">
        <div className="page-meta">
          <span>ESTRATÉGIA • Q3 2025</span>
          <span>Documento confidencial</span>
        </div>
        <h1>Construindo a próxima geração de experiências digitais</h1>
        <p className="lead">
          Uma visão estratégica para produtos mais inteligentes, inclusivos e profundamente humanos.
        </p>
        <div className="author-row">
          <div className="avatar small">AM</div>
          <div>
            <strong>Ana Martins</strong>
            <span>Atualizado hoje, 14:32</span>
          </div>
        </div>
        <hr />
        <h2>Visão e oportunidade</h2>
        <div className="selected-wrap">
          <BubbleMenu />
          <p className="selected-text">
            A inteligência artificial está redefinindo como equipes imaginam, constroem e evoluem
            produtos. Nossa oportunidade não está apenas em automatizar tarefas, mas em ampliar a
            capacidade criativa de cada pessoa.
          </p>
        </div>
        <blockquote>
          <Icon name="sparkle" size={18} />
          <p>
            “As melhores ferramentas desaparecem na experiência — elas dão clareza ao pensamento e
            espaço para grandes ideias.”
          </p>
        </blockquote>
        <h2>Princípios que orientam o produto</h2>
        <table>
          <thead>
            <tr>
              <th>Princípio</th>
              <th>Como aplicamos</th>
              <th>Impacto</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="table-dot dot-one" />
                Inteligência contextual
              </td>
              <td>Sugestões relevantes no fluxo</td>
              <td>
                <span className="status-chip">Alto</span>
              </td>
            </tr>
            <tr>
              <td>
                <span className="table-dot dot-two" />
                Confiança por design
              </td>
              <td>Transparência e controle</td>
              <td>
                <span className="status-chip">Crítico</span>
              </td>
            </tr>
            <tr>
              <td>
                <span className="table-dot dot-three" />
                Acesso universal
              </td>
              <td>WCAG 2.2 como base</td>
              <td>
                <span className="status-chip">Alto</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="comment-pin pin-one">1</div>
        <div className="comment-pin pin-two">
          <Icon name="comment" size={13} />
        </div>
      </article>
    </div>
  );
}

function AiPanel() {
  const [activeTab, setActiveTab] = useState("IA");
  const [sent, setSent] = useState(false);
  return (
    <aside className="ai-panel">
      <div className="panel-tabs">
        {["IA", "Comentários", "Revisões", "A11y"].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="panel-heading">
        <div className="agent-mark">
          <Icon
            name={
              activeTab === "IA" ? "sparkle" : activeTab === "A11y" ? "accessibility" : "comment"
            }
          />
        </div>
        <div>
          <strong>{activeTab === "IA" ? "Nexus AI Agent" : activeTab}</strong>
          <span>
            <i /> {activeTab === "IA" ? "Pronto para ajudar" : "Painel ativo"}
          </span>
        </div>
        <button>
          <Icon name="more" />
        </button>
      </div>
      <div className="panel-content">
        {activeTab === "IA" ? (
          <>
            <div className="ai-welcome">
              <Icon name="sparkle" />
              <strong>Como posso melhorar seu documento?</strong>
              <p>Posso revisar, resumir e transformar suas ideias sem tirar você do fluxo.</p>
            </div>
            <div className="user-message">
              Deixe o parágrafo selecionado mais persuasivo e objetivo.
            </div>
            <div className="agent-card">
              <div className="agent-label">
                <Icon name="sparkle" size={13} /> Nexus AI Agent
              </div>
              <strong>Reescrevendo parágrafo para torná-lo mais persuasivo...</strong>
              <div className="typing">
                <span />
                <span />
                <span />
              </div>
              <p>
                A IA não apenas acelera o trabalho — ela expande o que cada equipe é capaz de
                imaginar e realizar.
              </p>
              <div className="agent-actions">
                <button>Substituir</button>
                <button>Inserir abaixo</button>
              </div>
            </div>
            {sent && <div className="user-message">Agora resuma em três pontos.</div>}
          </>
        ) : (
          <div className="empty-panel">
            <Icon name={activeTab === "A11y" ? "accessibility" : "comment"} size={28} />
            <strong>{activeTab}</strong>
            <p>Esta visão está pronta para acompanhar seu documento em tempo real.</p>
          </div>
        )}
      </div>
      <div className="quick-prompts">
        {["Resumir", "Traduzir", "Criar tabela", "Tom formal"].map((text) => (
          <button key={text}>{text}</button>
        ))}
      </div>
      <div className="prompt-box">
        <textarea aria-label="Pergunte ao Nexus AI" placeholder="Pergunte ao Nexus AI..." />
        <div>
          <span>⌘ + Enter</span>
          <button onClick={() => setSent(true)} aria-label="Enviar">
            <Icon name="send" size={15} />
          </button>
        </div>
      </div>
      <p className="ai-disclaimer">A IA pode cometer erros. Revise antes de aplicar.</p>
    </aside>
  );
}

function ComponentStates() {
  return (
    <div className="state-strip">
      <span>Toolbar states</span>
      <div>
        <IconButton icon="align" label="Padrão" />
        <small>Default</small>
      </div>
      <div>
        <IconButton icon="link" label="Hover" state="hover-demo" />
        <small>Hover</small>
      </div>
      <div>
        <IconButton icon="comment" label="Ativo" state="active" />
        <small>Active</small>
      </div>
      <div>
        <IconButton icon="redo" label="Desabilitado" state="disabled" />
        <small>Disabled</small>
      </div>
    </div>
  );
}

function EditorFrame({ theme }: { theme: Theme }) {
  const [zoom, setZoom] = useState(100);
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className={`editor-frame ${theme.className}`}>
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">
            <Icon name="sparkle" size={18} />
          </span>
          <strong>Nexus</strong>
          <span>Editor</span>
        </div>
        <div className="document-title">
          <strong>Visão de Produto 2025</strong>
          <span>
            <Icon name="cloud" size={13} /> Salvo na nuvem
          </span>
        </div>
        <div className="header-actions">
          {theme.id === "playful" && (
            <div className="avatar-stack">
              <span>AM</span>
              <span>LT</span>
              <span>NC</span>
            </div>
          )}
          <button className="share-button">Compartilhar</button>
          <div className="avatar">AM</div>
        </div>
      </header>
      <nav className="menubar">
        {["Arquivo", "Editar", "Inserir", "Formatar", "Tabela", "Ferramentas", "Comentários"].map(
          (item) => (
            <button key={item} onClick={() => item === "Arquivo" && setMenuOpen(!menuOpen)}>
              {item}
            </button>
          ),
        )}
        <button className="ai-menu">
          <Icon name="sparkle" size={13} /> IA
        </button>
        {menuOpen && (
          <div className="file-menu">
            <button>
              Novo documento <kbd>⌘N</kbd>
            </button>
            <button>
              Abrir… <kbd>⌘O</kbd>
            </button>
            <button>Exportar como PDF</button>
          </div>
        )}
      </nav>
      <Toolbar themeId={theme.id} />
      <main className="editor-main">
        <Document themeId={theme.id} />
        <AiPanel />
      </main>
      <footer className="statusbar">
        <div>
          <span>1.248 palavras</span>
          <span>7.822 caracteres</span>
          <span>6 min de leitura</span>
        </div>
        <div className="save-state">
          <Icon name="cloud" size={13} /> Salvo há 2s
        </div>
        <div className="zoom-controls">
          <button onClick={() => setZoom(Math.max(50, zoom - 10))}>−</button>
          <span>{zoom}%</span>
          <button onClick={() => setZoom(Math.min(150, zoom + 10))}>+</button>
          <IconButton icon="fullscreen" label="Tela cheia" />
        </div>
      </footer>
      <ComponentStates />
    </div>
  );
}

function TokenKit({ theme }: { theme: Theme }) {
  return (
    <aside className={`token-kit ${theme.className}`}>
      <div className="kit-eyebrow">NEXUS / THEME {theme.number}</div>
      <h3>Design Tokens</h3>
      <p>{theme.name}</p>
      <section>
        <h4>Color system</h4>
        <div className="color-list">
          {theme.colors.map((color) => (
            <div key={color.value}>
              <i style={{ background: color.value }} />
              <span>
                {color.name}
                <small>{color.value}</small>
              </span>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h4>Typography</h4>
        {theme.fonts.map((font, i) => (
          <div className={`font-sample sample-${i}`} key={font}>
            <span>{i ? "Aa" : "Ag"}</span>
            <div>
              <strong>{font.split(" / ")[0]}</strong>
              <small>{font.split(" / ")[1]}</small>
            </div>
          </div>
        ))}
      </section>
      <section>
        <h4>Radius scale</h4>
        <div className="radius-row">
          {theme.radii.map((radius) => (
            <div key={radius}>
              <i style={{ borderRadius: `${radius === "999" ? 99 : radius}px` }} />
              <small>{radius}px</small>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h4>Iconography</h4>
        <div className="icon-row">
          <Icon name="sparkle" />
          <Icon name="comment" />
          <Icon name="accessibility" />
          <Icon name="code" />
        </div>
      </section>
      <div className="kit-note">
        <i /> WCAG AA ready
      </div>
    </aside>
  );
}

export default function App() {
  const [activeTheme, setActiveTheme] = useState("obsidian");

  function jumpTo(id: string) {
    setActiveTheme(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="showcase">
      <header className="showcase-header">
        <div>
          <span>NEXUS DESIGN EXPLORATION / 2025</span>
          <h1>
            One editor.
            <br />
            Four distinct worlds.
          </h1>
        </div>
        <p>
          Um sistema de interface para escrita de missão crítica, colaboração em tempo real e
          inteligência artificial nativa.
        </p>
        <nav>
          {themes.map((theme) => (
            <button
              key={theme.id}
              className={activeTheme === theme.id ? "active" : ""}
              onClick={() => jumpTo(theme.id)}
            >
              <span>{theme.number}</span>
              {theme.name}
            </button>
          ))}
        </nav>
      </header>
      {themes.map((theme) => (
        <section className="theme-section" id={theme.id} key={theme.id}>
          <div className="section-label">
            <div>
              <span>{theme.number} / 04</span>
              <h2>{theme.name}</h2>
            </div>
            <p>{theme.audience}</p>
          </div>
          <div className="theme-row">
            <EditorFrame theme={theme} />
            <TokenKit theme={theme} />
          </div>
        </section>
      ))}
      <footer className="showcase-footer">
        <span>NEXUS EDITOR</span>
        <p>Designed for focus. Built for intelligence.</p>
        <span>UI SYSTEM / 2025</span>
      </footer>
    </div>
  );
}
