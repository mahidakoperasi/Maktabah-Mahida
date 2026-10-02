import { desc, eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { revisions } from '@/db/schema';

export async function saveRevision(input: {
  entityType: string;
  entityId: number;
  data: Record<string, unknown>;
  note: string;
  actorId: number | null | undefined;
}) {
  await db.insert(revisions).values({
    entityType: input.entityType,
    entityId: input.entityId,
    data: input.data,
    revisionNote: input.note,
    createdBy: input.actorId ?? null,
  });
}

export async function listRevisions(entityType: string, entityId: number) {
  return db
    .select({
      id: revisions.id,
      data: revisions.data,
      note: revisions.revisionNote,
      createdAt: revisions.createdAt,
    })
    .from(revisions)
    .where(and(eq(revisions.entityType, entityType), eq(revisions.entityId, entityId)))
    .orderBy(desc(revisions.createdAt))
    .limit(20);
}
