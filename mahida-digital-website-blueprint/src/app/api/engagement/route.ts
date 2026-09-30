import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { and, count, desc, eq, gte } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { engagementComments, engagementLikes } from '@/db/schema';
import { GUEST_COOKIE, publicTargetExists, visitorHash, type EngagementKind } from '@/lib/engagement';

export const dynamic = 'force-dynamic';
const target = z.object({ kind: z.enum(['post', 'product', 'video', 'gallery']), id: z.coerce.number().int().positive() });
const input = target.extend({ action: z.enum(['like', 'comment']), author: z.string().trim().min(2).max(80).optional(), body: z.string().trim().min(3).max(1000).optional() });

function guest(request: NextRequest) {
  const token = request.cookies.get(GUEST_COOKIE)?.value;
  return token && /^[\da-f-]{36}$/i.test(token) ? token : null;
}

async function state(kind: EngagementKind, id: number, token: string | null) {
  const hash = token ? visitorHash(token) : null;
  const [likes] = await db.select({ value: count() }).from(engagementLikes).where(and(eq(engagementLikes.kind, kind), eq(engagementLikes.entityId, id)));
  const [commentsCount] = await db.select({ value: count() }).from(engagementComments).where(and(eq(engagementComments.kind, kind), eq(engagementComments.entityId, id), eq(engagementComments.status, 'published')));
  const own = hash ? await db.select({ id: engagementLikes.id }).from(engagementLikes).where(and(eq(engagementLikes.kind, kind), eq(engagementLikes.entityId, id), eq(engagementLikes.visitorHash, hash))).limit(1) : [];
  const comments = await db.select({ id: engagementComments.id, author: engagementComments.author, body: engagementComments.body, createdAt: engagementComments.createdAt })
    .from(engagementComments).where(and(eq(engagementComments.kind, kind), eq(engagementComments.entityId, id), eq(engagementComments.status, 'published')))
    .orderBy(desc(engagementComments.createdAt)).limit(40);
  return { likes: likes.value, commentCount: commentsCount.value, liked: own.length > 0, comments };
}

export async function GET(request: NextRequest) {
  const parsed = target.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success || !await publicTargetExists(parsed.data.kind, parsed.data.id)) return NextResponse.json({ error: 'Konten tidak ditemukan' }, { status: 404 });
  return NextResponse.json(await state(parsed.data.kind, parsed.data.id, guest(request)), { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== request.headers.get('host')) throw new Error('origin mismatch');
    } catch { return NextResponse.json({ error: 'Asal permintaan tidak valid' }, { status: 403 }); }
  }
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
  const { kind, id, action, author, body } = parsed.data;
  if (!await publicTargetExists(kind, id)) return NextResponse.json({ error: 'Konten tidak ditemukan' }, { status: 404 });
  const token = guest(request) ?? randomUUID();
  const hash = visitorHash(token);
  if (action === 'like') {
    const condition = and(eq(engagementLikes.kind, kind), eq(engagementLikes.entityId, id), eq(engagementLikes.visitorHash, hash));
    const own = await db.select({ id: engagementLikes.id }).from(engagementLikes).where(condition).limit(1);
    if (own.length) await db.delete(engagementLikes).where(condition);
    else await db.insert(engagementLikes).values({ kind, entityId: id, visitorHash: hash }).onConflictDoNothing();
  } else {
    if (!author || !body) return NextResponse.json({ error: 'Nama dan komentar wajib diisi' }, { status: 400 });
    const recent = await db.select({ id: engagementComments.id }).from(engagementComments).where(and(eq(engagementComments.visitorHash, hash), gte(engagementComments.createdAt, new Date(Date.now() - 60_000)))).limit(1);
    if (recent.length) return NextResponse.json({ error: 'Tunggu satu menit sebelum menulis lagi' }, { status: 429 });
    const [daily] = await db.select({ value: count() }).from(engagementComments).where(and(eq(engagementComments.visitorHash, hash), gte(engagementComments.createdAt, new Date(Date.now() - 86_400_000))));
    if (daily.value >= 8) return NextResponse.json({ error: 'Batas komentar harian tercapai' }, { status: 429 });
    await db.insert(engagementComments).values({ kind, entityId: id, visitorHash: hash, author, body });
  }
  const response = NextResponse.json({ ...await state(kind, id, token), message: action === 'comment' ? 'Komentar dikirim dan menunggu persetujuan Admin.' : '' });
  response.cookies.set(GUEST_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 365 });
  return response;
}
