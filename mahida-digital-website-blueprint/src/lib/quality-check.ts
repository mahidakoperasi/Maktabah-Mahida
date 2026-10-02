import { stat, realpath } from 'node:fs/promises';
import path from 'node:path';
import {
  driveIdFromUrl,
  youtubeIdFromUrl,
  videoEmbedFromUrl,
} from './media-links';
import { probeHttps, type ProbeResult } from './safe-probe';
import { publicRouteExists, snapshotHash } from './quality-store';
import type {
  QualityIssue,
  QualityReport,
  QualitySnapshot,
} from './quality-schema';
export const IMAGE_WARN_BYTES = 2 * 1024 * 1024,
  VIDEO_WARN_BYTES = 25 * 1024 * 1024;
export async function checkQuality(
  snapshot: QualitySnapshot,
  version: 'draft' | 'published',
  deps: {
    fetcher?: typeof fetch;
    probe?: typeof probeHttps;
    routeExists?: typeof publicRouteExists;
  } = {},
): Promise<QualityReport> {
  const issues: QualityIssue[] = [];
  const add = (
    severity: QualityIssue['severity'],
    code: string,
    label: string,
    message: string,
    url?: string,
  ) => issues.push({ severity, code, label, message, ...(url ? { url } : {}) });
  if (!snapshot.title.trim())
    add('error', 'empty-title', 'Judul', 'Judul utama masih kosong.');
  if (snapshot.status === 'archived')
    add(
      'error',
      'archived',
      'Status halaman',
      'Target diarsipkan. Tinjau status sebelum digunakan.',
    );
  else if (snapshot.status !== 'published')
    add(
      'info',
      'draft-status',
      'Status halaman',
      'Target masih draf dan belum tersedia bagi pengunjung.',
    );
  for (const heading of snapshot.headings)
    if (!heading.trim())
      add(
        'warning',
        'empty-heading',
        'Judul bagian',
        'Ada bagian aktif dengan judul kosong.',
      );
  for (const image of snapshot.images)
    if (!image.alt.trim())
      add(
        'warning',
        'missing-alt',
        image.label,
        'Isi teks alternatif yang menjelaskan foto.',
        image.url,
      );
  if (snapshot.target.startsWith('gallery:') && !snapshot.images.length)
    add(
      'error',
      'empty-gallery',
      'Galeri',
      'Belum ada foto yang dipilih dan ditampilkan.',
    );
  if (
    snapshot.texts.some((text) =>
      /[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+62|08)\d[\d\s-]{7,}|\b\d{16}\b/i.test(
        text,
      ),
    )
  )
    add(
      'warning',
      'personal-data',
      'Informasi pribadi',
      'Terdeteksi pola email, telepon, atau nomor identitas. Pastikan ini informasi resmi atau telah mendapat izin; deteksi tidak menggantikan tinjauan manusia.',
    );
  const resources = [
    ...snapshot.images.map((i) => ({ ...i, kind: 'image' as const })),
    ...snapshot.videos.map((v) => ({ ...v, kind: 'video' as const })),
    ...snapshot.links.map((l) => ({ ...l, kind: 'link' as const })),
  ];
  const unique = [
    ...new Map(resources.map((r) => [`${r.kind}:${r.url}`, r])).values(),
  ];
  const limit = 100,
    deadline = Date.now() + 25000;
  let checked = 0;
  const fetcher = deps.fetcher ?? fetch,
    probe = deps.probe ?? probeHttps,
    routeExists = deps.routeExists ?? publicRouteExists;
  const driveCache = new Map<
    string,
    Promise<{
      status: number;
      file?: {
        mimeType?: string;
        trashed?: boolean;
        size?: string;
        parents?: string[];
      };
    }>
  >();
  const signal = AbortSignal.timeout(25000);
  async function drive(source: string) {
    const id = driveIdFromUrl(source)!;
    const key = new URL(source).searchParams.get('resourcekey') ?? '';
    const cacheKey = id + '/' + key;
    if (!driveCache.has(cacheKey))
      driveCache.set(
        cacheKey,
        (async () => {
          if (!process.env.GOOGLE_DRIVE_API_KEY) return { status: 0 };
          const url = new URL(
            `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}`,
          );
          url.searchParams.set('fields', 'id,mimeType,trashed,size,parents');
          const headers: Record<string, string> = {
            'X-Goog-Api-Key': process.env.GOOGLE_DRIVE_API_KEY,
          };
          if (/^[\w-]{1,200}$/.test(key))
            headers['X-Goog-Drive-Resource-Keys'] = `${id}/${key}`;
          try {
            const response = await fetcher(url, {
              headers,
              cache: 'no-store',
              redirect: 'error',
              signal,
            });
            return {
              status: response.status,
              ...(response.ok ? { file: await response.json() } : {}),
            };
          } catch {
            return { status: 0 };
          }
        })(),
      );
    return driveCache.get(cacheKey)!;
  }
  function sizeIssue(
    bytes: number | undefined,
    kind: string,
    label: string,
    url: string,
  ) {
    if (bytes === undefined) {
      add(
        'info',
        'unknown-size',
        label,
        'Ukuran berkas tidak diberikan penyedia; periksa ukuran dan kecepatan muat secara manual.',
        url,
      );
      return;
    }
    if (bytes > (kind === 'image' ? IMAGE_WARN_BYTES : VIDEO_WARN_BYTES))
      add(
        'warning',
        'heavy-media',
        label,
        `Ukuran ${(bytes / 1024 / 1024).toFixed(1)} MB melebihi panduan ${kind === 'image' ? '2 MB per foto' : '25 MB per video langsung'}. Kompres atau gunakan video embed.`,
        url,
      );
  }
  for (let start = 0; start < Math.min(limit, unique.length); start += 4) {
    if (Date.now() > deadline) break;
    await Promise.all(
      unique.slice(start, Math.min(start + 4, limit)).map(async (r) => {
        checked++;
        if (!r.label.trim())
          add(
            'warning',
            'empty-button',
            r.kind === 'link' ? 'Tombol' : 'Video',
            'Judul atau label masih kosong.',
            r.url,
          );
        if (r.kind === 'link' && r.textLink && !r.url.startsWith('https://'))
          add(
            'warning',
            'unsupported-text-link',
            r.label,
            'Tautan dalam teks belum menjadi tombol yang dapat diklik. Gunakan alamat HTTPS lengkap, misalnya https://mahida.my.id/tentang/kontak.',
            r.url,
          );
        try {
          if (r.kind === 'link' && /^(mailto:|tel:)/i.test(r.url)) {
            if (
              !/^(?:mailto:[^\s@]+@[^\s@]+\.[^\s@]+|tel:\+?[\d -]{7,20})$/.test(
                r.url,
              )
            )
              add(
                'error',
                'invalid-contact',
                r.label,
                'Format kontak tidak valid.',
                r.url,
              );
            else
              add(
                'info',
                'manual-contact',
                r.label,
                'Format benar; pengiriman email/panggilan perlu dicoba manual.',
                r.url,
              );
            return;
          }
          const parsed = new URL(r.url, 'https://mahida.my.id');
          if (
            parsed.protocol !== 'https:' ||
            parsed.username ||
            parsed.password ||
            (parsed.port && parsed.port !== '443')
          ) {
            add(
              'error',
              'invalid-url',
              r.label,
              'Gunakan URL HTTPS publik tanpa kredensial atau port khusus.',
              r.url,
            );
            return;
          }
          const own = ['mahida.my.id', 'www.mahida.my.id'].includes(
            parsed.hostname,
          );
          if (r.kind === 'link' && own) {
            if (!(await routeExists(parsed.pathname)))
              add(
                'error',
                'broken-internal',
                r.label,
                'Halaman tujuan belum terbit, diarsipkan, atau tidak ditemukan.',
                r.url,
              );
            if (parsed.hash)
              add(
                'info',
                'manual-anchor',
                r.label,
                'Tautan bagian halaman perlu dicoba di pratinjau.',
                r.url,
              );
            return;
          }
          if (r.url.startsWith('/') && r.kind !== 'link') {
            if (
              !/^\/[\w./-]+$/.test(r.url) ||
              r.url.includes('..') ||
              r.url.startsWith('//')
            )
              throw Error('Path media lokal tidak valid');
            const root = await realpath(path.join(process.cwd(), 'public'));
            const resolved = await realpath(path.join(root, r.url));
            if (!resolved.startsWith(root + path.sep))
              throw Error('Path di luar aset publik');
            const file = await stat(resolved);
            if (!file.isFile()) throw Error('Berkas media tidak ditemukan');
            sizeIssue(file.size, r.kind, r.label, r.url);
            return;
          }
          if (driveIdFromUrl(r.url) && r.kind !== 'link') {
            const { status, file } = await drive(r.url);
            if (
              status === 0 ||
              [401, 403, 429].includes(status) ||
              status >= 500
            )
              add(
                'warning',
                'drive-unverified',
                r.label,
                'Drive belum dapat memastikan akses. Periksa layanan, API key, kuota, izin publik, lalu ulangi pemeriksaan.',
                r.url,
              );
            else if (!file || status !== 200 || file.trashed)
              add(
                'error',
                'drive-unavailable',
                r.label,
                'Foto/video tidak dapat dibaca publik, sudah dihapus, atau berada di sampah. Periksa berkas dan izin Drive.',
                r.url,
              );
            else {
              if (
                r.kind === 'image'
                  ? ![
                      'image/jpeg',
                      'image/png',
                      'image/webp',
                      'image/gif',
                      'image/avif',
                    ].includes(file.mimeType ?? '')
                  : !file.mimeType?.startsWith('video/')
              )
                add(
                  'error',
                  'wrong-media-type',
                  r.label,
                  'Jenis berkas tidak sesuai dengan foto/video.',
                  r.url,
                );
              if ('folderId' in r && r.folderId) {
                if (file.parents && !file.parents.includes(r.folderId))
                  add(
                    'warning',
                    'removed-from-folder',
                    r.label,
                    'Foto sudah tidak berada dalam folder album yang dipilih. Pindahkan kembali atau perbarui kurasi.',
                    r.url,
                  );
                else if (!file.parents)
                  add(
                    'info',
                    'folder-unverified',
                    r.label,
                    'Metadata folder asal tidak tersedia. Sinkronkan folder dan tinjau kandidat yang hilang.',
                    r.url,
                  );
              }
              sizeIssue(
                file.size ? Number(file.size) : undefined,
                r.kind,
                r.label,
                r.url,
              );
            }
            return;
          }
          const yt = r.kind === 'video' ? youtubeIdFromUrl(r.url) : null;
          if (yt) {
            const url = new URL('https://www.youtube.com/oembed');
            url.searchParams.set(
              'url',
              `https://www.youtube.com/watch?v=${yt}`,
            );
            url.searchParams.set('format', 'json');
            const response = await fetcher(url, {
              cache: 'no-store',
              redirect: 'error',
              signal,
            });
            await response.body?.cancel();
            if ([401, 404, 410].includes(response.status))
              add(
                'error',
                'youtube-unavailable',
                r.label,
                'YouTube tidak menyediakan embed publik. Video mungkin dihapus, privat, atau embed dibatasi.',
                r.url,
              );
            else if (!response.ok)
              add(
                'warning',
                'youtube-unverified',
                r.label,
                'YouTube belum dapat diperiksa. Coba ulang atau uji pemutaran.',
                r.url,
              );
            add(
              'info',
              'manual-playback',
              r.label,
              'Uji pemutaran di HP; batas usia/wilayah atau login bisa berbeda untuk pengunjung.',
              r.url,
            );
            return;
          }
          const result: ProbeResult = await probe(r.url);
          if (result.status === 404 || result.status === 410)
            add(
              'error',
              'broken-external',
              r.label,
              `Tujuan memberi HTTP ${result.status}. Perbarui tautannya.`,
              r.url,
            );
          else if (result.status < 200 || result.status >= 400)
            add(
              'warning',
              'external-unverified',
              r.label,
              `Tujuan memberi HTTP ${result.status}. Bisa membutuhkan login atau menolak pemeriksa; coba manual.`,
              r.url,
            );
          if (result.redirected)
            add(
              'info',
              'redirect',
              r.label,
              'Tautan dialihkan. Pastikan tujuan akhirnya benar.',
              r.url,
            );
          if (
            r.kind !== 'link' &&
            result.status >= 200 &&
            result.status < 300
          ) {
            const embed =
              r.kind === 'video' && Boolean(videoEmbedFromUrl(r.url));
            if (embed)
              add(
                'info',
                'manual-playback',
                r.label,
                'Halaman video tersedia; pemutaran embed perlu dicoba manual.',
                r.url,
              );
            else {
              if (result.type && !result.type.startsWith(r.kind + '/'))
                add(
                  'warning',
                  'unexpected-type',
                  r.label,
                  'Server tidak mengirim jenis media yang diharapkan. Uji tampilan/pemutaran.',
                  r.url,
                );
              sizeIssue(result.size, r.kind, r.label, r.url);
            }
          }
        } catch {
          add(
            'warning',
            'unverified',
            r.label,
            'Belum dapat diperiksa otomatis: jaringan, pembatasan penyedia, atau URL bukan HTTPS publik. Coba tautan secara manual.',
            r.url,
          );
        }
      }),
    );
  }
  if (checked < unique.length)
    add(
      'warning',
      'partial-check',
      'Batas pemeriksaan',
      `${unique.length - checked} tautan/media belum diperiksa karena batas 100 item atau waktu. Pecah halaman/album atau periksa sisanya manual.`,
    );
  add(
    'info',
    'manual-mobile',
    'Tampilan HP',
    'Gunakan pratinjau HP dan periksa teks, tombol, crop foto, serta menu. Pemeriksa tautan tidak menilai tampilan visual.',
  );
  return {
    target: snapshot.target,
    version,
    snapshotHash: snapshotHash(snapshot),
    checkedAt: new Date().toISOString(),
    issues,
    counts: {
      errors: issues.filter((i) => i.severity === 'error').length,
      warnings: issues.filter((i) => i.severity === 'warning').length,
      info: issues.filter((i) => i.severity === 'info').length,
    },
    checked,
    total: unique.length,
  };
}
