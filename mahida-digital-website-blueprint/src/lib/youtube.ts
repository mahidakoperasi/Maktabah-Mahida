export async function getYoutubeViews(videoId: string): Promise<number | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part','statistics');
    url.searchParams.set('id',videoId);
    url.searchParams.set('key',key);
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return null;
    const data = await response.json() as { items?: { statistics?: { viewCount?: string } }[] };
    const count = Number(data.items?.[0]?.statistics?.viewCount);
    return Number.isSafeInteger(count) && count >= 0 ? count : null;
  } catch { return null; }
}
