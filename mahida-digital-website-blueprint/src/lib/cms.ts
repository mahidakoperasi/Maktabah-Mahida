import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { cmsPages, navigationItems } from '@/db/schema';

export type PublicMenuItem = {
  id: number;
  label: string;
  path: string;
  children: { id: number; label: string; path: string }[];
};

export function validCmsPath(path: string) {
  return path === '/' || (
    /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*)(?:\/[a-z0-9]+(?:-[a-z0-9]+)*){0,3}$/.test(path) &&
    !/^\/(?:admin|api|masuk|daftar)(?:\/|$)/.test(path) &&
    !/^\/literasi\/artikel(?:\/|$)/.test(path)
  );
}

// Only paths served by the generic CMS route or its supported section catchalls.
// Existing system paths are seeded separately and can still be edited in place.
export function validNewCmsPath(path: string) {
  if (!validCmsPath(path) || path === '/') return false;
  const [, first, second] = path.split('/');
  if (['literasi', 'maktabah', 'profil', 'agenda', 'arsip', 'berita', 'kegiatan', 'kirim-karya'].includes(first)) return false;
  if (first === 'karya' && ['artikel', 'esai', 'terjemahan', 'manuskrip'].includes(second)) return false;
  if (first === 'media' && ['berita', 'kegiatan', 'pengumuman', 'video', 'galeri', 'tv'].includes(second)) return false;
  if (first === 'koperasi' && ['buku', 'ebook'].includes(second)) return false;
  return true;
}

export async function getPublicMenu(): Promise<PublicMenuItem[]> {
  if (!process.env.DATABASE_URL) return [];
  try {
    const rows = await db.select({
      id: navigationItems.id, parentId: navigationItems.parentId,
      label: navigationItems.label, path: navigationItems.path,
    }).from(navigationItems).innerJoin(cmsPages, eq(navigationItems.path, cmsPages.path))
      .where(and(eq(navigationItems.isVisible, true), eq(cmsPages.status, 'published')))
      .orderBy(asc(navigationItems.sortOrder), asc(navigationItems.id));
    return rows.filter((item) => item.parentId === null).map((item) => ({
      id: item.id, label: item.label, path: item.path,
      children: rows.filter((child) => child.parentId === item.id)
        .map((child) => ({ id: child.id, label: child.label, path: child.path })),
    }));
  } catch (error) {
    console.error('Navigation unavailable:', error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getPublicPage(path: string) {
  const [page] = await db.select().from(cmsPages)
    .where(eq(cmsPages.path, path)).limit(1);
  return page?.status === 'published' ? page : null;
}

export function paragraphs(text: string) {
  return text.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}
