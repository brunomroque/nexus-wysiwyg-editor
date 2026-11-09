export function serializeEditorContent(html: string): string {
  return JSON.stringify({
    version: 1,
    format: "html",
    content: html,
    updatedAt: new Date().toISOString(),
  });
}

export function deserializeEditorContent(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.content === "string") {
      return parsed.content;
    }
    return raw;
  } catch {
    return raw;
  }
}

