import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { engagementComments } from '@/db/schema';
import { getAdminUser } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  if (!await getAdminUser(request)) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const comments = await db.select({ id: engagementComments.id, kind: engagementComments.kind, entityId: engagementComments.entityId, author: engagementComments.author, body: engagementComments.body, status: engagementComments.status, createdAt: engagementComments.createdAt })
    .from(engagementComments).orderBy(desc(engagementComments.createdAt)).limit(100);
  return NextResponse.json({ comments });
}

export async function PATCH(request: NextRequest) {
  if (!await getAdminUser(request)) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const parsed = z.object({ id: z.number().int().positive(), action: z.enum(['publish', 'delete']) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
  const { id, action } = parsed.data;
  const [row] = action === 'delete'
    ? await db.delete(engagementComments).where(eq(engagementComments.id, id)).returning({ id: engagementComments.id })
    : await db.update(engagementComments).set({ status: 'published', reviewedAt: new Date() }).where(eq(engagementComments.id, id)).returning({ id: engagementComments.id });
  return NextResponse.json({ ok: Boolean(row) }, { status: row ? 200 : 404 });
}
