export type MentionCandidate = {
  id: string;
  handle: string;
  displayName: string;
};

export type CommentThread = {
  id: string;
  authorId: string;
  from: number;
  to: number;
  quote: string;
  message: string;
  mentions: string[];
  status: "open" | "resolved";
  createdAt: string;
};

export type SuggestedEdit = {
  id: string;
  authorId: string;
  from: number;
  to: number;
  originalText: string;
  proposedText: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

export type RevisionSnapshot = {
  id: string;
  authorId: string;
  label: string;
  html: string;
  createdAt: string;
};

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function extractMentionIds(message: string, candidates: MentionCandidate[]): string[] {
  const handles = new Map(candidates.map((c) => [c.handle.toLowerCase(), c.id]));
  const mentionMatches = message.match(/@([a-z0-9_.-]+)/gi) ?? [];
  return [
    ...new Set(
      mentionMatches
        .map((entry) => entry.slice(1).toLowerCase())
        .map((handle) => handles.get(handle))
        .filter(Boolean) as string[],
    ),
  ];
}

export function createCommentThread(input: {
  authorId: string;
  from: number;
  to: number;
  quote: string;
  message: string;
  candidates: MentionCandidate[];
}): CommentThread {
  return {
    id: createId("comment"),
    authorId: input.authorId,
    from: input.from,
    to: input.to,
    quote: input.quote,
    message: input.message.trim(),
    mentions: extractMentionIds(input.message, input.candidates),
    status: "open",
    createdAt: new Date().toISOString(),
  };
}

export function createSuggestedEdit(input: {
  authorId: string;
  from: number;
  to: number;
  originalText: string;
  proposedText: string;
}): SuggestedEdit {
  return {
    id: createId("suggestion"),
    authorId: input.authorId,
    from: input.from,
    to: input.to,
    originalText: input.originalText,
    proposedText: input.proposedText,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
}

export function createRevisionSnapshot(input: {
  authorId: string;
  label: string;
  html: string;
}): RevisionSnapshot {
  return {
    id: createId("revision"),
    authorId: input.authorId,
    label: input.label.trim() || "Manual Revision",
    html: input.html,
    createdAt: new Date().toISOString(),
  };
}

