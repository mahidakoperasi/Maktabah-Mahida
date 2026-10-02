import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/db';
import { sameOrigin } from '@/lib/request-origin';
import { requireAdminAccess } from '@/lib/admin-auth';
export async function GET(request: NextRequest) {
  if (!(await requireAdminAccess(request, 'primary')))
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const offset = Math.max(
    0,
    Math.min(
      100000,
      Math.trunc(Number(request.nextUrl.searchParams.get('offset')) || 0),
    ),
  );
  const { rows } = await pool.query(
    'SELECT * FROM contact_messages ORDER BY created_at DESC,id DESC LIMIT 50 OFFSET $1',
    [offset],
  );
  return NextResponse.json(
    { messages: rows },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
export async function PATCH(request: NextRequest) {
  if (!(await requireAdminAccess(request, 'primary')))
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  if (!sameOrigin(request))
    return NextResponse.json({ error: 'Asal tidak valid' }, { status: 403 });
  const parsed = z
    .object({
      id: z.number().int().positive(),
      status: z.enum(['new', 'handled']),
    })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
  await pool.query(
    "UPDATE contact_messages SET status=$2::varchar,handled_at=CASE WHEN $2::varchar='handled' THEN now() ELSE NULL END WHERE id=$1",
    [parsed.data.id, parsed.data.status],
  );
  return NextResponse.json({ ok: true });
}
