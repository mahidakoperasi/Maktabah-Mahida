import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, otpCodes } from '@/db/schema';
import { hashPassword, generateOTP, generateUUID } from '@/lib/utils';
import { eq } from 'drizzle-orm';

const rateLimitMap = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(email);

  if (!record || now - record.lastAttempt > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(email, { count: 1, lastAttempt: now });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }

  record.count++;
  record.lastAttempt = now;
  return true;
}

function databaseSetupError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as {
    code?: string;
    cause?: { code?: string };
  };

  const code = candidate.code ?? candidate.cause?.code;
  return code === '42P01' || code === '42703' || code === '42804';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nama, email, dan password wajib diisi' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter' },
        { status: 400 }
      );
    }

    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Coba lagi dalam 1 jam.' },
        { status: 429 }
      );
    }

    const existingUser = await db.select().from(users).where(eq(users.email, email));

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const [newUser] = await db.insert(users).values({
      uuid: generateUUID(),
      email,
      password: hashedPassword,
      name,
      role: 'user',
      emailVerified: false,
    }).returning();

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.update(otpCodes)
      .set({ used: true })
      .where(eq(otpCodes.userId, newUser.id));

    await db.insert(otpCodes).values({
      userId: newUser.id,
      code: otp,
      type: 'verification',
      expiresAt,
      used: false,
      attempts: 0,
    });

    console.log(`[OTP] Verification code for ${email}: ${otp}`);

    return NextResponse.json({
      message: 'Registrasi berhasil. Silakan verifikasi email Anda.',
      userId: newUser.id,
      devOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
    });

  } catch (error) {
    console.error('Registration error:', error);

    if (databaseSetupError(error)) {
      return NextResponse.json(
        {
          error: 'Database akun belum siap. Jalankan migration auth Mahida terlebih dahulu.',
          code: 'AUTH_SCHEMA_NOT_READY',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
