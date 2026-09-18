import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { SESSION_COOKIE_NAME, verifyToken } from '@/lib/utils';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      const response = NextResponse.json({ authenticated: false }, { status: 401 });
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
      return response;
    }

    const [user] = await db.select({
      id: users.id,
      uuid: users.uuid,
      email: users.email,
      name: users.name,
      avatar: users.avatar,
      bio: users.bio,
      role: users.role,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.id, payload.userId));

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
