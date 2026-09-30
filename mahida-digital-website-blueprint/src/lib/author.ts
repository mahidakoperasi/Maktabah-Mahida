import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { authors } from '@/db/schema';

export async function validAuthorId(authorId: number | null): Promise<boolean> {
  if (authorId === null) return true;
  const [author] = await db.select({ id: authors.id }).from(authors).where(eq(authors.id, authorId)).limit(1);
  return Boolean(author);
}
