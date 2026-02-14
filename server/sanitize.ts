import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize a string to prevent XSS attacks.
 * Strips all HTML tags for plain text fields.
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim();
}

/**
 * Sanitize HTML content (for WYSIWYG / rich text fields).
 * Allows safe HTML tags but strips dangerous ones (script, iframe, etc.).
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr", "blockquote", "pre", "code",
      "ul", "ol", "li",
      "strong", "em", "b", "i", "u", "s", "del", "ins", "mark", "sub", "sup",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span",
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "class", "style",
      "target", "rel", "width", "height",
      "colspan", "rowspan",
    ],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Recursively sanitize all string values in an object.
 * Useful for sanitizing entire form submissions.
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  htmlFields: string[] = []
): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (typeof value === "string") {
      (result as any)[key] = htmlFields.includes(key)
        ? sanitizeHtml(value)
        : sanitizeText(value);
    }
  }
  return result;
}
