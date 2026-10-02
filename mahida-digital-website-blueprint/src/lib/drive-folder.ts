// Server-only usage: imported exclusively by the authenticated gallery API.
// No API key is returned; the explicit apiKey/fetcher parameters permit isolated tests.
import { driveFolder, type DriveCandidate } from './gallery-schema';

export class DriveFolderError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
// Fixed Google endpoint only. Never fetch a URL supplied by the admin (SSRF).
export async function listDrivePhotos(folderUrl: string, apiKey = process.env.GOOGLE_DRIVE_API_KEY, fetcher: typeof fetch = fetch) {
  const folder = driveFolder(folderUrl);
  if (!folder) throw new DriveFolderError('Tautan folder Google Drive tidak valid.');
  if (!apiKey) throw new DriveFolderError('Sinkronisasi belum aktif. Isi GOOGLE_DRIVE_API_KEY di server dan aktifkan Google Drive API. Input foto satu per satu tetap dapat digunakan.', 503);
  const deadline = AbortSignal.timeout(25000);
  async function get(path: string, params: Record<string, string>) {
    const url = new URL(`https://www.googleapis.com/drive/v3/${path}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    // The key never enters browser JSON, public URLs, error messages, or logs.
    const headers: Record<string, string> = { 'X-Goog-Api-Key': apiKey! };
    if (folder!.resourceKey) headers['X-Goog-Drive-Resource-Keys'] = `${folder!.id}/${folder!.resourceKey}`;
    let response: Response;
    try { response = await fetcher(url, { headers, cache: 'no-store', redirect: 'error', signal: deadline }); }
    catch { throw new DriveFolderError('Google Drive belum merespons. Coba sinkronkan kembali; draft dan terbitan tetap aman.', 502); }
    if (!response.ok) {
      if (response.status === 404) throw new DriveFolderError('Folder tidak ditemukan atau tidak dapat dibaca publik. Atur Siapa saja yang memiliki link → Pelihat.', 400);
      if ([403, 429].includes(response.status)) throw new DriveFolderError('Drive menolak permintaan. Periksa akses publik folder, Google Drive API, pembatasan API key, dan kuota.', 502);
      throw new DriveFolderError('Tidak dapat membaca folder Drive. Coba lagi nanti.', 502);
    }
    return response.json();
  }
  const metadata = await get(`files/${folder.id}`, { fields: 'id,name,mimeType,trashed' });
  if (metadata.mimeType !== 'application/vnd.google-apps.folder' || metadata.trashed) throw new DriveFolderError('Tautan harus menunjuk folder Drive aktif, bukan berkas atau folder sampah.');
  const candidates: DriveCandidate[] = [];
  const seen = new Set<string>();
  const tokens = new Set<string>();
  let pageToken = '';
  do {
    const result = await get('files', {
      q: `'${folder.id}' in parents and trashed = false and (mimeType = 'image/jpeg' or mimeType = 'image/png' or mimeType = 'image/webp' or mimeType = 'image/gif' or mimeType = 'image/avif')`,
      fields: 'nextPageToken,incompleteSearch,files(id,name,mimeType,resourceKey,imageMediaMetadata(width,height))',
      orderBy: 'name', pageSize: '100', ...(pageToken ? { pageToken } : {}),
    });
    if (result.incompleteSearch || !Array.isArray(result.files)) throw new DriveFolderError('Daftar folder belum lengkap. Sinkronisasi dibatalkan agar kandidat tidak berubah sebagian.', 502);
    for (const file of result.files) {
      if (!/^[\w-]{10,200}$/.test(file.id ?? '') || seen.has(file.id) || !['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.mimeType)) continue;
      seen.add(file.id);
      const key = /^[\w-]{1,200}$/.test(file.resourceKey ?? '') ? `?resourcekey=${encodeURIComponent(file.resourceKey)}` : '';
      candidates.push({ id: file.id, name: String(file.name ?? 'Foto').slice(0, 250), imageUrl: `https://drive.google.com/file/d/${file.id}/view${key}`, width: file.imageMediaMetadata?.width, height: file.imageMediaMetadata?.height, missing: false });
    }
    if (candidates.length > 500) throw new DriveFolderError('Folder memuat lebih dari 500 foto. Pisahkan folder agar kurasi tetap ringan. Sinkronisasi ini belum mengubah data.');
    pageToken = result.nextPageToken ?? '';
    if (pageToken && tokens.has(pageToken)) throw new DriveFolderError('Daftar Drive tidak lengkap. Silakan sinkronkan kembali.', 502);
    tokens.add(pageToken);
  } while (pageToken);
  return { name: String(metadata.name ?? '').slice(0, 250), candidates };
}
