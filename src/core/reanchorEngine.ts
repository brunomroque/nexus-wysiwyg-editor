export function reanchorRangeByQuote(
  content: string,
  quote: string,
  hintFrom: number,
  hintTo: number,
): { from: number; to: number; matched: boolean } {
  if (!quote.trim()) {
    return { from: hintFrom, to: hintTo, matched: false };
  }

  const exactIdx = content.indexOf(quote);
  if (exactIdx >= 0) {
    return { from: exactIdx, to: exactIdx + quote.length, matched: true };
  }

  const normalizedContent = content.toLowerCase();
  const normalizedQuote = quote.toLowerCase();
  const lowerIdx = normalizedContent.indexOf(normalizedQuote);
  if (lowerIdx >= 0) {
    return { from: lowerIdx, to: lowerIdx + quote.length, matched: true };
  }

  return { from: hintFrom, to: hintTo, matched: false };
}

