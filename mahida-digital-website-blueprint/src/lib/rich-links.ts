export function safeArticleLink(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
