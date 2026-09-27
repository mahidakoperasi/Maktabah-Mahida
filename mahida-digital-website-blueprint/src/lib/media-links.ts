export function youtubeIdFromUrl(input: string): string | null {
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:') return null;
    let id: string | null = null;
    if (url.hostname === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
    else if (url.hostname === 'youtube.com' || url.hostname === 'www.youtube.com' || url.hostname === 'm.youtube.com') {
      id = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] ?? null;
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

export function driveIdFromUrl(input: string): string | null {
  try {
    const url = new URL(input);
    if (!['drive.google.com','www.drive.google.com'].includes(url.hostname) || url.protocol !== 'https:') return null;
    const id = url.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1] ?? url.searchParams.get('id');
    return id && /^[\w-]{10,}$/.test(id) ? id : null;
  } catch { return null; }
}

export function driveThumbnailUrl(input: string): string | null {
  const id = driveIdFromUrl(input);
  return id ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1200` : null;
}

export function publicImageUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const drive = driveThumbnailUrl(trimmed);
  if (drive) return drive;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch { return null; }
}

export type VideoEmbed = { platform: 'YouTube' | 'Facebook' | 'Instagram' | 'TikTok'; embedUrl: string; url: string; thumbnail?: string; portrait?: boolean };

export function videoEmbedFromUrl(input: string): VideoEmbed | null {
  const youtube = youtubeIdFromUrl(input);
  if (youtube) return { platform: 'YouTube', url: input, embedUrl: `https://www.youtube-nocookie.com/embed/${youtube}?autoplay=1&playsinline=1`, thumbnail: `https://i.ytimg.com/vi/${youtube}/hqdefault.jpg` };
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:') return null;
    const host = url.hostname.toLowerCase();
    const path = url.pathname;
    if (host === 'www.tiktok.com' || host === 'tiktok.com') {
      const id = /^\/@[^/]+\/video\/(\d{12,25})\/?$/.exec(path)?.[1];
      return id ? { platform: 'TikTok', url: input, embedUrl: `https://www.tiktok.com/player/v1/${id}`, portrait: true } : null;
    }
    if (host === 'www.instagram.com' || host === 'instagram.com') {
      const match = /^\/(p|reel|tv)\/([\w-]{5,30})\/?$/.exec(path);
      return match ? { platform: 'Instagram', url: input, embedUrl: `https://www.instagram.com/${match[1]}/${match[2]}/embed/`, portrait: true } : null;
    }
    if (['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com'].includes(host)) {
      const video = /^\/watch\/?$/.test(path) && /^\d+$/.test(url.searchParams.get('v') ?? '')
        || /\/videos\/\d+\/?$/.test(path)
        || /^\/reel\/\d+\/?$/.test(path);
      if (!video) return null;
      return { platform: 'Facebook', url: input, embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(input)}&show_text=false` };
    }
    return null;
  } catch { return null; }
}
