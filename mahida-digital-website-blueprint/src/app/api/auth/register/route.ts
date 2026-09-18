import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, otpCodes } from '@/db/schema';
import { hashPassword, generateOTP, generateUUID } from '@/lib/utils';
import { eq } from 'drizzle-orm';

// Rate limiting - simple in-memory (production should use Redis)
const rateLimitMap = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
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
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validation
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

    // Rate limit check
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Coba lagi dalam 1 jam.' },
        { status: 429 }
      );
    }

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const [newUser] = await db.insert(users).values({
      uuid: generateUUID(),
      email,
      password: hashedPassword,
      name,
      role: 'user',
      emailVerified: false,
    }).returning();

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Invalidate any previous OTPs for this user
    await db.update(otpCodes)
      .set({ used: true })
      .where(eq(otpCodes.userId, newUser.id));

    // Save new OTP
    await db.insert(otpCodes).values({
      userId: newUser.id,
      code: otp,
      type: 'verification',
      expiresAt,
      used: false,
      attempts: 0,
    });

    // TODO: Send OTP via email (using nodemailer or similar)
    console.log(`[OTP] Verification code for ${email}: ${otp}`);

    return NextResponse.json({
      message: 'Registrasi berhasil. Silakan verifikasi email Anda.',
      userId: newUser.id,
      // For development only - remove in production
      devOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
