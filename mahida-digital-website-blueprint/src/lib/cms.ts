import { and, asc, eq } from 'drizzle-orm';
import { cache } from 'react';
import { isDesignPreview } from './design-store';
import { flushScheduledPublications, getPublicationPreview } from './publication-store';
import { db } from '@/db';
import { cmsPages, navigationItems } from '@/db/schema';

export type PublicMenuItem = {
  id: number;
  label: string;
  path: string;
  children: PublicMenuItem[];
};

type MenuRow = Omit<PublicMenuItem, 'children'> & { parentId: number | null };

export function buildPublicMenu(rows: MenuRow[]): PublicMenuItem[] {
  const nodes = new Map(
    rows.map((row) => [
      row.id,
      {
        id: row.id,
        label: row.label,
        path: row.path,
        children: [] as PublicMenuItem[],
      },
    ]),
  );
  const roots: PublicMenuItem[] = [];
  for (const row of rows) {
    const node = nodes.get(row.id)!;
    if (row.parentId === null) roots.push(node);
    else nodes.get(row.parentId)?.children.push(node);
  }
  return roots;
}

export { validCmsPath, validNewCmsPath } from './cms-paths';

export const getPublicMenu = cache(async function getPublicMenu(): Promise<
  PublicMenuItem[]
> {
  if (!process.env.DATABASE_URL) return [];
  await flushScheduledPublications();
  try {
    const rows = await db
      .select({
        id: navigationItems.id,
        parentId: navigationItems.parentId,
        label: navigationItems.label,
        path: navigationItems.path,
      })
      .from(navigationItems)
      .innerJoin(cmsPages, eq(navigationItems.path, cmsPages.path))
      .where(
        and(
          eq(navigationItems.isVisible, true),
          eq(cmsPages.status, 'published'),
        ),
      )
      .orderBy(asc(navigationItems.sortOrder), asc(navigationItems.id));
    return buildPublicMenu(rows);
  } catch (error) {
    console.error(
      'Navigation unavailable:',
      error instanceof Error ? error.message : error,
    );
    return [];
  }
});

export async function getPublicPage(path: string) {
  await flushScheduledPublications();
  const preview = await getPublicationPreview(`page:${path}`);
  const [page] = await db
    .select()
    .from(cmsPages)
    .where(eq(cmsPages.path, path))
    .limit(1);
  if (page && preview?.type === 'page') return { ...page, title: preview.title, intro: preview.intro, body: preview.body };
  return page &&
    (page.status === 'published' || (await isDesignPreview(path, 'content')))
    ? page
    : null;
}

export function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
