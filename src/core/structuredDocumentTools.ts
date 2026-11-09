export type TocItem = {
  level: number;
  text: string;
  anchor: string;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

export function extractTocFromHtml(html: string): TocItem[] {
  if (typeof DOMParser === "undefined") return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const headings = Array.from(doc.querySelectorAll("h1,h2,h3"));
  return headings.map((node, index) => {
    const text = (node.textContent ?? "").trim() || `Section ${index + 1}`;
    return {
      level: Number(node.tagName.slice(1)),
      text,
      anchor: slugify(text) || `section-${index + 1}`,
    };
  });
}

export function appendPageBreakHtml(html: string): string {
  return `${html}<hr data-page-break="true" />`;
}

export function appendFootnoteHtml(html: string, note: string): string {
  const clean = note.trim();
  if (!clean) return html;
  return `${html}<p class="footnote"><sup>*</sup> ${clean}</p>`;
}

export function pageBreakFragmentHtml(): string {
  return `<hr data-page-break="true" />`;
}

export function footnoteFragmentHtml(note: string): string {
  const clean = note.trim();
  if (!clean) return "";
  return `<p class="footnote"><sup>*</sup> ${clean}</p>`;
}

