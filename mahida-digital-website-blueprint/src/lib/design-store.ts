import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { pool } from '@/db';
import { getAdminUser } from './admin-auth';
import {
  contentSchema,
  designPath,
  mediaSchema,
  type MediaDesign,
  type PageContent,
} from './design-schema';
export const isDesignPreview = cache(async function isDesignPreview(
  path: string,
) {
  if (
    !designPath(path) ||
    (await headers()).get('x-mahida-design-preview') !== path
  )
    return false;
  const cookie = (await cookies()).toString();
  return Boolean(
    await getAdminUser(
      new NextRequest('https://mahida.invalid', { headers: { cookie } }),
    ),
  );
});
export async function getDesign<K extends 'media' | 'content'>(
  path: string,
  kind: K,
): Promise<(K extends 'media' ? MediaDesign : PageContent) | null> {
  if (!designPath(path) || !process.env.DATABASE_URL) return null;
  const preview = await isDesignPreview(path);
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
