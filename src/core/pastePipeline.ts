import DOMPurify from "dompurify";

const BLOCK_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "blockquote",
  "pre",
  "ul",
  "ol",
  "li",
  "table",
  "tr",
  "td",
  "th",
]);

function cleanupOfficeArtifacts(input: string): string {
  return input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s*mso-[^:]+:[^;"]+;?/gi, "")
    .replace(/\s*class="[^"]*Mso[^"]*"/gi, "")
    .replace(/<o:p>\s*<\/o:p>/gi, "")
    .replace(/<o:p>[\s\S]*?<\/o:p>/gi, "");
}

export function sanitizePastedHtml(input: string): string {
  const cleaned = cleanupOfficeArtifacts(input);
  return DOMPurify.sanitize(cleaned, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "h1",
      "h2",
      "h3",
      "strong",
      "em",
      "u",
      "s",
      "a",
      "ul",
      "ol",
      "li",
      "table",
      "thead",
      "tbody",
      "tr",
      "td",
      "th",
      "blockquote",
      "code",
      "pre",
      "span",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "colspan", "rowspan", "data-merge-tag", "data-page-break"],
    FORBID_ATTR: ["style", "onerror", "onclick", "onload"],
  });
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel", "data-merge-tag", "data-page-break"],
  });
}

export function plainTextToHtml(input: string): string {
  const escaped = input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  const lines = escaped
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line, idx, arr) => line.length > 0 || (idx > 0 && arr[idx - 1].length > 0));
  if (lines.length === 0) return "<p></p>";
  return lines
    .map((line) => {
      if (!line) return "<p><br></p>";
      const lower = line.toLowerCase();
      if ([...BLOCK_TAGS].some((tag) => lower.startsWith(`<${tag}`))) return line;
      return `<p>${line}</p>`;
    })
    .join("");
}

