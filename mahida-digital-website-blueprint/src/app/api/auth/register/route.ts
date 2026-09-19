import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, otpCodes } from '@/db/schema';
import { hashPassword, generateOTP, generateUUID } from '@/lib/utils';
import { sendVerificationEmail } from '@/lib/email';
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

async function issueVerificationCode(userId: number, email: string) {
  await db.update(otpCodes)
    .set({ used: true })
    .where(eq(otpCodes.userId, userId));

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(otpCodes).values({
    userId,
    code: otp,
    type: 'verification',
    expiresAt,
    used: false,
    attempts: 0,
  });

  await sendVerificationEmail(email, otp);
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

    const [existingUser] = await db.select().from(users).where(eq(users.email, email));

    if (existingUser) {
      if (!existingUser.emailVerified) {
        try {
          await issueVerificationCode(existingUser.id, email);
        } catch (mailError) {
          console.error('Verification email error:', mailError);
          return NextResponse.json(
            {
              error: 'Akun sudah ada, tetapi email verifikasi gagal dikirim. Periksa konfigurasi email lalu coba Kirim Ulang.',
              requiresVerification: true,
            },
            { status: 502 }
          );
        }

        return NextResponse.json({
          message: 'Email sudah terdaftar tetapi belum terverifikasi. Kode baru telah dikirim.',
          userId: existingUser.id,
          requiresVerification: true,
        });
      }

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

    try {
      await issueVerificationCode(newUser.id, email);
    } catch (mailError) {
      console.error('Verification email error:', mailError);
      return NextResponse.json(
        {
          error: 'Akun berhasil dibuat, tetapi email verifikasi gagal dikirim. Silakan coba Kirim Ulang.',
          requiresVerification: true,
          userId: newUser.id,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: 'Registrasi berhasil. Kode verifikasi telah dikirim ke email Anda.',
      userId: newUser.id,
      requiresVerification: true,
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
