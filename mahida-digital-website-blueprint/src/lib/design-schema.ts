import { z } from 'zod';
import { educationUnits, unitHref } from './design-pages';
import {
  driveIdFromUrl,
  publicImageUrl,
  youtubeIdFromUrl,
} from './media-links';
export const designPaths = [
  '/',
  '/tentang/profil',
  ...educationUnits.map((u) => unitHref(u.slug)),
  '/tentang/kontak',
  '/tentang/pendaftaran',
  '/media',
  '/media/kegiatan',
  '/media/video',
  '/media/galeri',
];
export const designPath = (path: string) => designPaths.includes(path);
export function safeUrl(value: string) {
  if (!value) return true;
  try {
    const u = new URL(value);
    return (
      u.protocol === 'https:' &&
      !u.username &&
      !u.password &&
      !/[<>"\\]/.test(value)
    );
  } catch {
    return false;
  }
}
export const urlField = z
  .string()
  .trim()
  .max(2048)
  .refine(safeUrl, 'Gunakan URL HTTPS tanpa kredensial atau HTML');
export const imageField = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (v) => !v || (safeUrl(v) && Boolean(publicImageUrl(v))),
    'Gunakan foto HTTPS atau Drive publik',
  );
export function directVideo(value: string) {
  try {
    const u = new URL(value);
    return safeUrl(value) && /\.mp4$/i.test(u.pathname);
  } catch {
    return false;
  }
}
export const clipSchema = z
  .object({
    id: z.string().uuid(),
    area: z.enum([
      'hero',
      'inline',
      'gallery',
      'card-kegiatan',
      'card-video',
      'card-galeri',
    ]),
    afterSection: z.string().max(80).default(''),
    type: z.enum(['image', 'video']),
    url: urlField.refine(Boolean),
    alt: z.string().trim().min(1).max(200),
    poster: imageField.default(''),
    size: z.enum(['small', 'medium', 'wide']),
    ratio: z.enum(['square', 'portrait', 'landscape', 'original']),
    focalX: z.number().min(0).max(100),
    focalY: z.number().min(0).max(100),
  })
  .refine(
    (v) =>
      v.type === 'image'
        ? Boolean(publicImageUrl(v.url))
        : directVideo(v.url) ||
          Boolean(driveIdFromUrl(v.url)) ||
          Boolean(youtubeIdFromUrl(v.url)),
    'Video harus MP4 HTTPS, Drive, atau YouTube',
  );
export const mediaSchema = z
  .object({ clips: z.array(clipSchema).max(40) })
  .superRefine((v, c) => {
    const ids = v.clips.map((x) => x.id);
    if (new Set(ids).size !== ids.length)
      c.addIssue({ code: 'custom', message: 'ID media harus unik' });
    for (const area of ['card-kegiatan', 'card-video', 'card-galeri']) {
      if (
        v.clips.filter((x) => x.area === area).length > 1 ||
        v.clips.some((x) => x.area === area && x.type !== 'image')
      )
        c.addIssue({ code: 'custom', message: 'Satu foto per kartu Media' });
    }
    if (v.clips.filter((x) => x.area === 'hero').length > 1)
      c.addIssue({ code: 'custom', message: 'Pilih satu media hero' });
  });
export const contentSchema = z
  .object({
    sections: z
      .array(
        z.object({
          id: z.string().min(1).max(80),
          title: z.string().trim().max(200),
          body: z.string().max(30000),
          enabled: z.boolean(),
          icon: z
            .enum(['none', 'book', 'people', 'location', 'award'])
            .default('none'),
        }),
      )
      .max(30),
    address: z.string().trim().max(2000).default(''),
    mapsUrl: urlField
      .refine(
        (v) =>
          !v ||
          [
            'www.google.com',
            'google.com',
            'maps.google.com',
            'maps.app.goo.gl',
          ].includes(safeUrl(v) ? new URL(v).hostname : ''),
        'Gunakan tautan Google Maps resmi',
      )
      .default(''),
    mapEmbed: urlField
      .refine(
        (v) =>
          !v || /^https:\/\/www\.google\.com\/maps\/embed(?:\?|\/)/.test(v),
        'Gunakan embed Google Maps resmi',
      )
      .default(''),
    serviceHours: z.string().max(2000).default(''),
    contactFormEnabled: z.boolean().default(false),
    brochureUrl: urlField
      .refine(
        (v) => !v || /\.pdf(?:[?#]|$)/i.test(v),
        'Gunakan tautan PDF HTTPS',
      )
      .default(''),
    fees: z.string().max(10000).default(''),
    faq: z
      .array(
        z.object({
          question: z.string().trim().min(1).max(300),
          answer: z.string().trim().min(1).max(3000),
        }),
      )
      .max(30)
      .default([]),
    testimonials: z
      .array(
        z.object({
          name: z.string().trim().min(1).max(150),
          text: z.string().trim().min(1).max(2000),
          permission: z.literal(true),
        }),
      )
      .max(20)
      .default([]),
    featuredVideoId: z.number().int().positive().nullable().default(null),
    showWorks: z.boolean().default(true),
    showEducation: z.boolean().default(true),
  })
  .superRefine((v, c) => {
    if (new Set(v.sections.map((s) => s.id)).size !== v.sections.length)
      c.addIssue({ code: 'custom', message: 'ID bagian harus unik' });
  });
export type Clip = z.infer<typeof clipSchema>;
export type MediaDesign = z.infer<typeof mediaSchema>;
export type PageContent = z.infer<typeof contentSchema>;
export const emptyContent = contentSchema.parse({ sections: [] });
export const sectionSuggestions = (path: string): string[] => {
  if (path === '/tentang/profil')
    return [
      'Sejarah dan Muassis',
      'Pengasuh dan Pengurus',
      'Visi, Misi, dan Tujuan',
      'Kekhasan Pesantren',
      'Alamat dan Lokasi',
    ];
  if (path.endsWith('madrasah-diniyyah'))
    return [
      'Kurikulum dan Kitab Rujukan',
      'Waktu dan Sistem KBM',
      'Target Lulusan',
      'Pengurus dan Dewan Asatidz',
      'Penempatan Kelas',
      'Ringkasan Pendaftaran',
    ];
  if (path.endsWith('madrasah-al-quran'))
    return [
      'Visi, Misi, dan Target Lulusan',
      'Program dan Metode',
      'Fasilitas',
      'Tenaga Pengajar',
      'Legalitas dan Prestasi',
      'Ringkasan Pendaftaran',
    ];
  if (path.endsWith('unu-blitar'))
    return [
      'Hubungan Mahida dan UNU Blitar',
      'Fakultas dan Program Studi',
      'Kuliah Sambil Mondok',
      'Sistem Kelas Resmi',
      'Beasiswa dan Biaya',
      'Prospek Lulusan dan Gelar',
      'Profil Pengajar',
      'Ringkasan Pendaftaran',
    ];
  if (path.includes('unit-pendidikan'))
    return [
      'Status Lembaga dan Identitas Resmi',
      'Integrasi Kurikulum',
      'Program Unggulan',
      'Ekstrakurikuler',
      'Fasilitas Akademik',
      'Prestasi',
      'Ringkasan Pendaftaran',
    ];
  return [];
};
