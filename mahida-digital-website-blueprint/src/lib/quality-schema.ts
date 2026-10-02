import { z } from 'zod';
import { validCmsPath } from './cms-paths';
export const checklistLabels = {
  status: 'Status dan tujuan halaman sudah benar',
  photos: 'Foto, video, dan teks alternatif sudah diperiksa',
  buttons: 'Tombol dan tautan menuju alamat yang benar',
  mobile: 'Pratinjau HP sudah diperiksa dan nyaman dibaca',
  privacy: 'Informasi pribadi dan izin publikasi sudah ditinjau',
} as const;
export type Checklist = Record<keyof typeof checklistLabels, boolean>;
export const emptyChecklist: Checklist = {
  status: false,
  photos: false,
  buttons: false,
  mobile: false,
  privacy: false,
};
export const checklistSchema = z.object({
  status: z.literal(true),
  photos: z.literal(true),
  buttons: z.literal(true),
  mobile: z.literal(true),
  privacy: z.literal(true),
});
export function qualityScope(target: string) {
  if (target === 'admissions') return 'admissions' as const;
  if (target === 'commerce' || /^product:[1-9]\d*$/.test(target))
    return 'commerce' as const;
  if (
    /^(gallery|video):[1-9]\d*$/.test(target) ||
    (target.startsWith('media:') && validCmsPath(target.slice(6)))
  )
    return 'media' as const;
  if (
    /^(post|announcement):[1-9]\d*$/.test(target) ||
    (target.startsWith('content:') && validCmsPath(target.slice(8)))
  )
    return 'content' as const;
  if (
    target === 'homepage' ||
    target === 'directory' ||
    target === 'navigation' ||
    (target.startsWith('page:') && validCmsPath(target.slice(5)))
  )
    return 'primary' as const;
  return null;
}
export type QualityIssue = {
  severity: 'error' | 'warning' | 'info';
  code: string;
  label: string;
  message: string;
  url?: string;
};
export type QualityReport = {
  target: string;
  version: 'draft' | 'published';
  snapshotHash: string;
  checkedAt: string;
  issues: QualityIssue[];
  counts: { errors: number; warnings: number; info: number };
  checked: number;
  total: number;
};
export type QualitySnapshot = {
  target: string;
  title: string;
  status: string;
  publicPath: string;
  texts: string[];
  headings: string[];
  images: { url: string; alt: string; label: string; folderId?: string }[];
  videos: { url: string; label: string }[];
  links: { url: string; label: string; textLink?: boolean }[];
};
