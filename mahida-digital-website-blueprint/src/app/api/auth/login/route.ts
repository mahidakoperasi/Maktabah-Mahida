import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import {
  verifyPassword,
  generateToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from '@/lib/utils';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { allowAdminLogin } from '@/lib/admin-login-limit';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(255)),
  password: z.string().min(1).max(1024),
});

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Format JSON tidak valid' }, { status: 400 });
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Email atau password tidak valid' }, { status: 400 });
    }
    const { email, password } = parsed.data;

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user || user.role !== 'admin' || !user.emailVerified) {
      return NextResponse.json(
        { error: 'Email atau password admin salah' },
        { status: 401 }
      );
    }

    if (!(await allowAdminLogin(user.id))) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' },
        { status: 429 }
      );
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Email atau password admin salah' },
        { status: 401 }
      );
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: 'admin',
    });

    const { password: _password, ...userData } = user;

    const response = NextResponse.json({
      message: 'Login admin berhasil',
      user: userData,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
