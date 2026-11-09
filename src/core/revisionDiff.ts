export type DiffPart = {
  type: "same" | "added" | "removed";
  text: string;
};

export function buildWordDiff(oldText: string, newText: string): DiffPart[] {
  const oldWords = oldText.trim().split(/\s+/).filter(Boolean);
  const newWords = newText.trim().split(/\s+/).filter(Boolean);

  const result: DiffPart[] = [];
  let i = 0;
  let j = 0;

  while (i < oldWords.length && j < newWords.length) {
    if (oldWords[i] === newWords[j]) {
      result.push({ type: "same", text: `${oldWords[i]} ` });
      i++;
      j++;
    } else {
      result.push({ type: "removed", text: `${oldWords[i]} ` });
      result.push({ type: "added", text: `${newWords[j]} ` });
      i++;
      j++;
    }
  }

  while (i < oldWords.length) {
    result.push({ type: "removed", text: `${oldWords[i]} ` });
    i++;
  }

  while (j < newWords.length) {
    result.push({ type: "added", text: `${newWords[j]} ` });
    j++;
  }

  return result;
}

