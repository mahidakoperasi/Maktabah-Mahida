import { slugify } from '@/lib/utils';

export function extractYouTubeId(input: string): string | null {
  const value = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;

  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, '');

    if (hostname === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      const fromQuery = url.searchParams.get('v');
      const pathParts = url.pathname.split('/').filter(Boolean);
      const fromPath = ['shorts', 'embed', 'live'].includes(pathParts[0]) ? pathParts[1] : null;
      const id = fromQuery || fromPath;
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function normalizeHttpUrl(value: unknown): string | null {
  const input = String(value ?? '').trim();
  if (!input) return null;

  try {
    const url = new URL(input);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function defaultYouTubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export async function makeUniqueSlug(
  title: string,
  fallback: string,
  exists: (candidate: string) => Promise<boolean>
): Promise<string> {
  const base = slugify(title) || fallback;
  let candidate = base;
  let suffix = 2;

  while (await exists(candidate)) {
    candidate = `${base}-${suffix++}`;
  }

  return candidate;
}
