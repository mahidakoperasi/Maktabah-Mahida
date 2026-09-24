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

const loginRateLimit = new Map<string, { count: number; lastAttempt: number }>();

function checkLoginRateLimit(email: string): boolean {
  const now = Date.now();
  const record = loginRateLimit.get(email);

  if (!record || now - record.lastAttempt > 15 * 60 * 1000) {
    loginRateLimit.set(email, { count: 1, lastAttempt: now });
    return true;
  }

  if (record.count >= 10) return false;

  record.count++;
  record.lastAttempt = now;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    if (!checkLoginRateLimit(email)) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' },
        { status: 429 }
      );
    }

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Email atau password admin salah' },
        { status: 401 }
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
