export type ExportFormat = "pdf" | "docx";

export type ExportJob = {
  id: string;
  format: ExportFormat;
  status: "queued" | "processing" | "done" | "failed";
  createdAt: string;
  downloadName?: string;
  downloadUrl?: string;
  error?: string;
  progress?: number;
  source?: "local" | "remote";
};

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function htmlToMarkdown(html: string): string {
  return html
    .replace(/<h1>(.*?)<\/h1>/gi, "# $1\n\n")
    .replace(/<h2>(.*?)<\/h2>/gi, "## $1\n\n")
    .replace(/<h3>(.*?)<\/h3>/gi, "### $1\n\n")
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<em>(.*?)<\/em>/gi, "*$1*")
    .replace(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    .replace(/<li>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  return lines
    .map((line) => {
      if (!line.trim()) return "<p><br></p>";
      if (line.startsWith("### ")) return `<h3>${line.slice(4)}</h3>`;
      if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith("# ")) return `<h1>${line.slice(2)}</h1>`;
      if (line.startsWith("- ")) return `<ul><li>${line.slice(2)}</li></ul>`;
      return `<p>${line}</p>`;
    })
    .join("");
}

export async function enqueueExportJob(format: ExportFormat, html: string): Promise<ExportJob> {
  const jobBase: ExportJob = {
    id: createId("export"),
    format,
    status: "queued",
    createdAt: new Date().toISOString(),
  };

  await new Promise((resolve) => window.setTimeout(resolve, 80));
  try {
    const payload = `Format: ${format.toUpperCase()}\nGenerated: ${new Date().toISOString()}\n\n${html}`;
    const blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    return {
      ...jobBase,
      status: "done",
      downloadName: `export-${jobBase.id}.${format}`,
      downloadUrl,
      source: "local",
    };
  } catch (error) {
    return {
      ...jobBase,
      status: "failed",
      error: error instanceof Error ? error.message : "Export failed.",
      source: "local",
    };
  }
}

