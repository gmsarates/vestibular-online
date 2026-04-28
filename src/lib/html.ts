const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "span",
  "ul",
  "ol",
  "li",
]);

export function decodeHtmlEntities(input: string): string {
  return input
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replace(/&#(\d+);/g, (_match, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)));
}

export function sanitizeBasicHtml(input: string): string {
  // Remove script/style blocks entirely
  let html = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Strip tags not on the allowlist
  html = html.replace(/<\/?([a-zA-Z0-9-]+)(\s[^>]*)?>/g, (full, tagName: string) => {
    const tag = tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";

    const isClosing = full.startsWith("</");
    if (isClosing) return `</${tag}>`;
    return `<${tag}>`;
  });

  // Kill obvious javascript: URLs if they survived in text
  html = html.replace(/javascript:/gi, "");

  return html;
}

export function sanitizeExamInstructionHtml(raw: string): string {
  return sanitizeBasicHtml(decodeHtmlEntities(raw));
}

