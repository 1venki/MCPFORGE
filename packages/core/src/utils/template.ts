const TOKEN_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function renderTemplate(template: string, values: Record<string, unknown>): string {
  return template.replace(TOKEN_REGEX, (_, key: string) => {
    const value = values[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

export function extractTemplateTokens(template: string): string[] {
  const tokens = new Set<string>();
  let match = TOKEN_REGEX.exec(template);
  while (match) {
    tokens.add(match[1]);
    match = TOKEN_REGEX.exec(template);
  }
  TOKEN_REGEX.lastIndex = 0;
  return [...tokens];
}
