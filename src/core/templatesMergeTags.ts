export type EditorTemplate = {
  id: string;
  label: string;
  html: string;
  sectionKey?: string;
};

export type MergeTag = {
  id: string;
  label: string;
  token: string;
  sectionKey?: string;
};

export const DEFAULT_EDITOR_TEMPLATES: EditorTemplate[] = [
  {
    id: "document-standard",
    label: "Standard Document",
    sectionKey: "general",
    html: `
      <h1>Document Title</h1>
      <p>Date: {{date}}</p>
      <p>Author: {{author_name}}</p>
      <h2>Overview</h2>
      <p>Provide a summary of the topic or project here.</p>
      <h2>Key Points</h2>
      <ul>
        <li>First critical observation</li>
        <li>Action items for the team</li>
        <li>Next milestones and delivery dates</li>
      </ul>
      <h2>Conclusion</h2>
      <p>Document finalized and approved.</p>
    `.trim(),
  },
  {
    id: "announcement-template",
    label: "Official Announcement",
    sectionKey: "general",
    html: `
      <h1>Official Notice</h1>
      <p>Dear {{recipient_name}},</p>
      <p>We are pleased to inform you that {{event_name}} is scheduled for {{date}}.</p>
      <p>Best regards,</p>
      <p>{{author_name}}</p>
    `.trim(),
  },
];

export const DEFAULT_MERGE_TAGS: MergeTag[] = [
  { id: "date", label: "Current Date", token: "{{date}}", sectionKey: "general" },
  { id: "author-name", label: "Author Name", token: "{{author_name}}", sectionKey: "general" },
  { id: "recipient-name", label: "Recipient Name", token: "{{recipient_name}}", sectionKey: "general" },
  { id: "event-name", label: "Event Name", token: "{{event_name}}", sectionKey: "general" },
];

export function resolveMergeTags(html: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((output, [key, value]) => {
    const token = `{{${key}}}`;
    return output.split(token).join(value);
  }, html);
}

