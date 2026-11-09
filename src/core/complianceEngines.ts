export type LinkIssue = {
  href: string;
  severity: "warning" | "error";
  message: string;
  status?: number | "unreachable";
};

export type AccessibilityIssue = {
  severity: "warning" | "error";
  message: string;
};

export type SpellIssue = {
  word: string;
  message: string;
};

const COMMON_WORDS_PT = new Set([
  "de",
  "da",
  "do",
  "e",
  "a",
  "o",
  "para",
  "em",
  "com",
  "uma",
  "um",
  "texto",
  "comentario",
  "revisao",
  "sugestao",
  "editor",
  "documento",
  "sessao",
  "sistema",
  "projeto",
]);

const COMMON_WORDS_EN = new Set([
  "the",
  "and",
  "with",
  "text",
  "review",
  "suggestion",
  "editor",
  "document",
  "session",
  "project",
  "system",
  "first",
  "overview",
  "action",
  "team",
]);

export function checkLinksFromHtml(html: string): LinkIssue[] {
  if (typeof DOMParser === "undefined") return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const links = Array.from(doc.querySelectorAll("a[href]"));
  const issues: LinkIssue[] = [];

  for (const link of links) {
    const href = (link.getAttribute("href") ?? "").trim();
    if (!href) {
      issues.push({
        href: "",
        severity: "error",
        message: "Link with empty URL.",
      });
      continue;
    }

    if (href.startsWith("http://")) {
      issues.push({
        href,
        severity: "warning",
        message: "Insecure HTTP link. Consider using HTTPS.",
      });
      continue;
    }

    if (!href.startsWith("https://") && !href.startsWith("mailto:") && !href.startsWith("#")) {
      issues.push({
        href,
        severity: "warning",
        message: "Unconventional protocol or relative link.",
      });
    }
  }

  return issues;
}

export async function checkLinkReachability(href: string): Promise<number | "unreachable"> {
  if (!/^https?:\/\//i.test(href)) return "unreachable";
  try {
    const response = await fetch(href, { method: "HEAD", mode: "no-cors" });
    return response.status || 200;
  } catch {
    return "unreachable";
  }
}

export function checkAccessibilityFromHtml(html: string): AccessibilityIssue[] {
  if (typeof DOMParser === "undefined") return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const issues: AccessibilityIssue[] = [];

  const images = Array.from(doc.querySelectorAll("img"));
  for (const img of images) {
    const alt = img.getAttribute("alt");
    if (!alt || !alt.trim()) {
      issues.push({
        severity: "error",
        message: "Image is missing alt description attribute.",
      });
    }
  }

  const headings = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6"));
  let previousLevel = 0;
  for (const heading of headings) {
    const level = Number(heading.tagName.slice(1));
    if (previousLevel > 0 && level - previousLevel > 1) {
      issues.push({
        severity: "warning",
        message: `Heading hierarchy jumped from H${previousLevel} to H${level}.`,
      });
    }
    previousLevel = level;
  }

  const tables = Array.from(doc.querySelectorAll("table"));
  for (const table of tables) {
    const hasHeader = Boolean(table.querySelector("th"));
    if (!hasHeader) {
      issues.push({
        severity: "warning",
        message: "Table is missing header cells (th).",
      });
    }
  }

  return issues;
}

export function spellcheckFromHtml(html: string, locale = "pt-BR"): SpellIssue[] {
  if (typeof DOMParser === "undefined") return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const text = doc.body.textContent ?? "";
  const tokens = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4);

  const wordBank = locale.startsWith("en") ? COMMON_WORDS_EN : COMMON_WORDS_PT;
  const issues: SpellIssue[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    if (seen.has(token) || /^\d+$/.test(token)) continue;
    seen.add(token);

    if (!wordBank.has(token) && token.length > 15) {
      issues.push({
        word: token,
        message: `Unusually long word or potential typo: "${token}".`,
      });
    }
  }

  return issues.slice(0, 10);
}

