import { createHmac } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { galleries, posts, products, videos } from '@/db/schema';

export type EngagementKind = 'post' | 'product' | 'video' | 'gallery';
export const GUEST_COOKIE = 'mahida_guest';

export function visitorHash(token: string) {
  return createHmac('sha256', process.env.JWT_SECRET!).update(token).digest('hex');
}

export async function publicTargetExists(kind: EngagementKind, id: number): Promise<boolean> {
  if (kind === 'post') return Boolean((await db.select({ id: posts.id }).from(posts).where(and(eq(posts.id, id), eq(posts.status, 'published'))).limit(1))[0]);
  if (kind === 'product') return Boolean((await db.select({ id: products.id }).from(products).where(and(eq(products.id, id), eq(products.status, 'published'))).limit(1))[0]);
  if (kind === 'video') return Boolean((await db.select({ id: videos.id }).from(videos).where(and(eq(videos.id, id), eq(videos.status, 'published'))).limit(1))[0]);
  return Boolean((await db.select({ id: galleries.id }).from(galleries).where(and(eq(galleries.id, id), eq(galleries.status, 'published'))).limit(1))[0]);
}
