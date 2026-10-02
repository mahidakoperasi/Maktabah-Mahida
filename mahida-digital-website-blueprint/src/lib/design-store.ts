import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { pool } from '@/db';
import { getAdminUser } from './admin-auth';
import { canAccess, type StoredAdminAccess } from './admin-permissions';
import { PRIMARY_ADMIN_EMAIL } from './admin-config';
import {
  contentSchema,
  designPath,
  mediaSchema,
  type MediaDesign,
  type PageContent,
} from './design-schema';
export const isDesignPreview = cache(async function isDesignPreview(
  path: string,
  kind?: 'media' | 'content',
) {
  if (
    !designPath(path) ||
    (await headers()).get('x-mahida-design-preview') !== path
  )
    return false;
  const previewKind = (await headers()).get('x-mahida-design-kind');
  if (kind && previewKind && previewKind !== kind) return false;
  const cookie = (await cookies()).toString();
  const admin = await getAdminUser(
    new NextRequest('https://mahida.invalid', { headers: { cookie } }),
  );
  if (!admin) return false;
  const primary = admin.email.toLowerCase() === PRIMARY_ADMIN_EMAIL;
  const access = admin.adminAccess as StoredAdminAccess;
  return kind
    ? canAccess(access, kind, primary)
    : canAccess(access, 'media', primary) ||
        canAccess(access, 'content', primary);
});
export async function getDesign<K extends 'media' | 'content'>(
  path: string,
  kind: K,
): Promise<(K extends 'media' ? MediaDesign : PageContent) | null> {
  if (!designPath(path) || !process.env.DATABASE_URL) return null;
  const preview = await isDesignPreview(path, kind);
  const { rows } = await pool.query(
    'SELECT draft,published FROM design_documents WHERE path=$1 AND kind=$2',
    [path, kind],
  );
  const raw = preview
    ? (rows[0]?.draft ?? rows[0]?.published)
    : rows[0]?.published;
  const parsed = (kind === 'media' ? mediaSchema : contentSchema).safeParse(
    raw,
  );
  return parsed.success
    ? (parsed.data as K extends 'media' ? MediaDesign : PageContent)
    : null;
}
