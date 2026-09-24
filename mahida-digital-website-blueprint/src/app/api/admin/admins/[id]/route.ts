import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { PRIMARY_ADMIN_EMAIL } from '@/lib/admin-config';
import { SESSION_COOKIE_NAME, verifyToken } from '@/lib/utils';

async function requirePrimaryAdmin(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const [user] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (
    !user ||
    user.role !== 'admin' ||
    user.email.toLowerCase() !== PRIMARY_ADMIN_EMAIL
  ) {
    return null;
  }

  return user;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requester = await requirePrimaryAdmin(request);

  if (!requester) {
    return NextResponse.json({ error: 'Akses hanya untuk admin utama.' }, { status: 403 });
  }

  const { id } = await params;
  const targetId = Number(id);

  if (!Number.isInteger(targetId) || targetId <= 0) {
    return NextResponse.json({ error: 'ID admin tidak valid.' }, { status: 400 });
  }

  const [target] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, targetId))
    .limit(1);

  if (!target || target.role !== 'admin') {
    return NextResponse.json({ error: 'Admin tidak ditemukan.' }, { status: 404 });
  }

  if (target.email.toLowerCase() === PRIMARY_ADMIN_EMAIL) {
    return NextResponse.json(
      { error: 'Admin utama tidak dapat dihapus atau diturunkan aksesnya.' },
      { status: 400 }
    );
  }

  await db
    .update(users)
    .set({ role: 'user', updatedAt: new Date() })
    .where(eq(users.id, targetId));

  return NextResponse.json({ message: 'Akses admin berhasil dicabut.' });
}
