import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, otpCodes } from '@/db/schema';
import { generateToken } from '@/lib/utils';
import { eq, and, gt } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, type = 'verification' } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email dan kode OTP wajib diisi' },
        { status: 400 }
      );
    }

    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Find valid OTP
    const now = new Date();
    const [validOtp] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.userId, user.id),
          eq(otpCodes.type, type),
          eq(otpCodes.used, false),
          gt(otpCodes.expiresAt, now)
        )
      )
      .orderBy(otpCodes.createdAt);

    if (!validOtp) {
      return NextResponse.json(
        { error: 'OTP tidak valid atau sudah kedaluwarsa. Silakan minta kode baru.' },
        { status: 400 }
      );
    }

    // Check attempts
    if ((validOtp.attempts ?? 0) >= 5) {
      await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, validOtp.id));
      return NextResponse.json(
        { error: 'Kode OTP sudah tidak berlaku. Silakan minta kode baru.' },
        { status: 400 }
      );
    }

    // Increment attempts
    await db.update(otpCodes).set({
      attempts: (validOtp.attempts ?? 0) + 1,
    }).where(eq(otpCodes.id, validOtp.id));

    // Verify code
    if (validOtp.code !== code) {
      return NextResponse.json(
        { error: 'Kode OTP salah' },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, validOtp.id));

    // Verify user email
    if (type === 'verification') {
      await db.update(users).set({ emailVerified: true }).where(eq(users.id, user.id));
    }

    // Generate token for auto-login after verification
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'user' | 'admin',
    });

    const { password: _, ...userData } = user;

    return NextResponse.json({
      message: 'Verifikasi berhasil',
      token,
      user: { ...userData, emailVerified: true },
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
