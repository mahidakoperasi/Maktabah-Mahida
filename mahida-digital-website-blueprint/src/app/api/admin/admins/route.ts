import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { PRIMARY_ADMIN_EMAIL } from '@/lib/admin-config';
import { hashPassword, SESSION_COOKIE_NAME, verifyToken } from '@/lib/utils';

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

export async function GET(request: NextRequest) {
  const requester = await requirePrimaryAdmin(request);

  if (!requester) {
    return NextResponse.json({ error: 'Akses hanya untuk admin utama.' }, { status: 403 });
  }

  const admins = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, 'admin'))
    .orderBy(asc(users.id));

  return NextResponse.json({
    admins: admins.map((admin) => ({
      ...admin,
      isPrimary: admin.email.toLowerCase() === PRIMARY_ADMIN_EMAIL,
    })),
  });
}

export async function POST(request: NextRequest) {
  const requester = await requirePrimaryAdmin(request);

  if (!requester) {
    return NextResponse.json({ error: 'Akses hanya untuk admin utama.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nama, email, dan password wajib diisi.' },
        { status: 400 }
      );
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter.' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'Email tersebut sudah terdaftar di database.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [admin] = await db
      .insert(users)
      .values({
        name,
        email,
        password: passwordHash,
        role: 'admin',
        emailVerified: true,
        updatedAt: new Date(),
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      });

    return NextResponse.json(
      { admin: { ...admin, isPrimary: false } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json({ error: 'Gagal membuat admin baru.' }, { status: 500 });
  }
}
