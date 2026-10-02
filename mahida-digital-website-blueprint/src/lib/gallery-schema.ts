import { z } from 'zod';
import { publicImageUrl } from './media-links';

export function driveFolder(input: string): { id: string; resourceKey: string | null } | null {
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:' || !['drive.google.com', 'www.drive.google.com'].includes(url.hostname) || url.username || url.password || url.port) return null;
    const id = /^\/drive\/(?:u\/\d+\/)?folders\/([\w-]{10,200})\/?$/.exec(url.pathname)?.[1];
    const key = url.searchParams.get('resourcekey');
    if (!id || (key && !/^[\w-]{1,200}$/.test(key))) return null;
    return { id, resourceKey: key };
  } catch { return null; }
}

export const galleryPhotoSchema = z.object({
  id: z.string().min(1).max(200).regex(/^[\w-]+$/),
  // Preserve existing local/HTTPS gallery assets as well as Drive photos.
  // These URLs are rendered by the browser, never fetched by the server.
  imageUrl: z.string().max(2048).refine((url) => Boolean(publicImageUrl(url)), 'Gunakan URL foto HTTPS atau path media lokal yang valid'),
  title: z.string().trim().max(250).default(''),
  caption: z.string().trim().max(1000).default(''),
  alt: z.string().trim().max(500).default(''),
  selected: z.boolean().default(true),
  visible: z.boolean().default(true),
  size: z.enum(['small', 'medium', 'large']).default('medium'),
  ratio: z.enum(['original', 'landscape', 'portrait', 'square']).default('original'),
  crop: z.boolean().default(false),
  focalX: z.number().min(0).max(100).default(50),
  focalY: z.number().min(0).max(100).default(50),
});
export const gallerySchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().trim().max(5000).default(''),
  folderUrl: z.string().trim().max(2048).refine((url) => !url || Boolean(driveFolder(url)), 'Gunakan tautan folder Google Drive HTTPS').default(''),
  layout: z.enum(['grid', 'masonry', 'spotlight']).default('masonry'),
  photos: z.array(galleryPhotoSchema).max(500).default([]),
}).superRefine((data, ctx) => {
  if (data.photos.filter((p) => p.selected).length > 40) ctx.addIssue({ code: 'custom', message: 'Maksimal 40 foto terpilih per album', path: ['photos'] });
  // Old galleries can contain repeated URLs with distinct image rows; keep
  // those editable. The new candidate/manual UI prevents adding repeats.
  if (new Set(data.photos.map((p) => p.id)).size !== data.photos.length) ctx.addIssue({ code: 'custom', message: 'ID foto dalam album tidak boleh duplikat', path: ['photos'] });
});
export type GalleryPhoto = z.infer<typeof galleryPhotoSchema>;
export type GalleryData = z.infer<typeof gallerySchema>;
export type DriveCandidate = { id: string; name: string; imageUrl: string; width?: number; height?: number; missing: boolean };
export function visibleGalleryPhotos(data: GalleryData) { return data.photos.filter((p) => p.selected && p.visible); }
export function mergeCandidates(previous: DriveCandidate[], incoming: DriveCandidate[]): DriveCandidate[] {
  const current = new Map(incoming.map((p) => [p.id, p]));
  return [...incoming, ...previous.filter((p) => !current.has(p.id)).map((p) => ({ ...p, missing: true }))].slice(0, 500);
}
export function photoFromCandidate(candidate: DriveCandidate): GalleryPhoto {
  return galleryPhotoSchema.parse({ id: candidate.id, imageUrl: candidate.imageUrl, title: candidate.name.replace(/\.[^.]+$/, ''), selected: true });
}
