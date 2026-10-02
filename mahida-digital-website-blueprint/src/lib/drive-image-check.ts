import { driveIdFromUrl } from './media-links';
// Only the fixed official metadata endpoint is fetched. No arbitrary admin URL,
// redirects, original image download, credentials in responses, or OAuth writes.
export async function checkDriveImages(
  urls: string[],
  apiKey = process.env.GOOGLE_DRIVE_API_KEY,
  fetcher: typeof fetch = fetch,
) {
  const files = new Map<string, string>();
  for (const url of urls) {
    const id = driveIdFromUrl(url);
    if (id) files.set(id, url);
  }
  if (!files.size) return;
  if (files.size > 200) throw Error('Maksimal 200 foto Drive dalam satu publikasi.');
  if (!apiKey)
    throw Error(
      'Pemeriksaan foto Drive memerlukan konfigurasi Google Drive API di server. Draf tetap tersimpan.',
    );
  const signal = AbortSignal.timeout(20000);
  const entries = [...files];
  for (let start = 0; start < entries.length; start += 4) {
    await Promise.all(
      entries.slice(start, start + 4).map(async ([id, source]) => {
        const url = new URL(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}`,
        );
        url.searchParams.set('fields', 'id,mimeType,trashed');
        const headers: Record<string, string> = { 'X-Goog-Api-Key': apiKey };
        const key = new URL(source).searchParams.get('resourcekey');
        if (key && /^[\w-]{1,200}$/.test(key))
          headers['X-Goog-Drive-Resource-Keys'] = `${id}/${key}`;
        let response: Response;
        try {
          response = await fetcher(url, {
            headers,
            redirect: 'error',
            cache: 'no-store',
            signal,
          });
        } catch {
          throw Error(
            'Foto Drive belum dapat diperiksa. Coba lagi; terbitan belum berubah.',
          );
        }
        if (!response.ok)
          throw Error(
            `Foto Drive ${id} tidak dapat dibaca publik atau kuota API ditolak. Periksa akses Siapa saja yang memiliki link → Pelihat.`,
          );
        const file = await response.json();
        if (
          file.trashed ||
          !['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(
            file.mimeType,
          )
        )
          throw Error(
            `Berkas Drive ${id} harus berupa foto aktif yang dapat dibaca publik.`,
          );
      }),
    );
  }
}
export function markerImages(text: string) {
  return [...text.matchAll(/\[\[image:(https:\/\/[^\]|\s]+)/gi)].map((m) => m[1]);
}
