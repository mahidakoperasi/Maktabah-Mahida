import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, otpCodes } from '@/db/schema';
import { generateOTP } from '@/lib/utils';
import { sendVerificationEmail } from '@/lib/email';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: 'Email wajib diisi' },
        { status: 400 }
      );
    }

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return NextResponse.json(
        { error: 'Akun tidak ditemukan' },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email sudah terverifikasi' },
        { status: 409 }
      );
    }

    await db.update(otpCodes)
      .set({ used: true })
      .where(eq(otpCodes.userId, user.id));

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.insert(otpCodes).values({
      userId: user.id,
      code: otp,
      type: 'verification',
      expiresAt,
      used: false,
      attempts: 0,
    });

    await sendVerificationEmail(email, otp);

    return NextResponse.json({
      message: 'Kode verifikasi baru telah dikirim ke email Anda.',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'Gagal mengirim ulang kode verifikasi' },
      { status: 500 }
    );
  }
}
