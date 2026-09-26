import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';
import {
  EMPTY_PUBLIC_DIRECTORY,
  PUBLIC_DIRECTORY_KEY,
  publicDirectorySchema,
  type PublicDirectory,
} from '@/lib/public-directory';

export async function getPublicDirectory(): Promise<PublicDirectory> {
  const [row] = await db.select({ value: settings.value }).from(settings)
    .where(eq(settings.key, PUBLIC_DIRECTORY_KEY)).limit(1);
  if (!row?.value) return EMPTY_PUBLIC_DIRECTORY;
  try {
    const parsed = publicDirectorySchema.safeParse(JSON.parse(row.value));
    return parsed.success ? parsed.data : EMPTY_PUBLIC_DIRECTORY;
  } catch {
    return EMPTY_PUBLIC_DIRECTORY;
  }
}
