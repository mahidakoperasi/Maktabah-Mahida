import { db } from '@/db';
import { activityLogs } from '@/db/schema';

export type ActivityAction = 'created' | 'updated' | 'published' | 'archived' | 'restored' | 'hidden' | 'access_granted' | 'access_revoked';

export async function logActivity(input: {
  actorId: number | null | undefined;
  action: ActivityAction;
  targetType: string;
  targetId?: number | string | null;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.insert(activityLogs).values({
      actorId: input.actorId ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId == null ? null : String(input.targetId),
      summary: input.summary.slice(0, 500),
      metadata: input.metadata ?? {},
    });
  } catch (error) {
    // A failed log must never discard a legitimate editorial save.
    console.error('Activity log write failed', error);
  }
}
