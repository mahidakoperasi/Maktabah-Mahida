import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, otpCodes } from '@/db/schema';
import {
  generateToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from '@/lib/utils';
import { eq, and, gt, desc } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const code = String(body.code ?? '').trim();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email dan kode OTP wajib diisi' },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Kode OTP harus terdiri dari 6 digit' },
        { status: 400 }
      );
    }

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    const now = new Date();
    const [validOtp] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.userId, user.id),
          eq(otpCodes.type, 'verification'),
          eq(otpCodes.used, false),
          gt(otpCodes.expiresAt, now)
        )
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (!validOtp) {
      return NextResponse.json(
        { error: 'OTP tidak valid atau sudah kedaluwarsa. Silakan minta kode baru.' },
        { status: 400 }
      );
    }

    if ((validOtp.attempts ?? 0) >= 5) {
      await db.update(otpCodes)
        .set({ used: true })
        .where(eq(otpCodes.id, validOtp.id));

      return NextResponse.json(
        { error: 'Kode OTP sudah tidak berlaku. Silakan minta kode baru.' },
        { status: 400 }
      );
    }

    if (validOtp.code !== code) {
      const nextAttempts = (validOtp.attempts ?? 0) + 1;
      await db.update(otpCodes)
        .set({
          attempts: nextAttempts,
          used: nextAttempts >= 5,
        })
        .where(eq(otpCodes.id, validOtp.id));

      return NextResponse.json(
        { error: 'Kode OTP salah' },
        { status: 400 }
      );
    }

    await db.update(otpCodes)
      .set({ used: true })
      .where(eq(otpCodes.id, validOtp.id));

    await db.update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'user' | 'admin',
    });

    const { password: _password, ...userData } = user;

    const response = NextResponse.json({
      message: 'Verifikasi berhasil',
      user: { ...userData, emailVerified: true },
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
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
