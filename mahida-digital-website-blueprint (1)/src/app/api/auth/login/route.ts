import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, otpCodes } from '@/db/schema';
import { verifyPassword, generateToken, generateOTP } from '@/lib/utils';
import { eq } from 'drizzle-orm';

const loginRateLimit = new Map<string, { count: number; lastAttempt: number }>();

function checkLoginRateLimit(email: string): boolean {
  const now = Date.now();
  const record = loginRateLimit.get(email);
  
  if (!record || now - record.lastAttempt > 15 * 60 * 1000) {
    loginRateLimit.set(email, { count: 1, lastAttempt: now });
    return true;
  }
  
  if (record.count >= 10) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    // Rate limit
    if (!checkLoginRateLimit(email)) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' },
        { status: 429 }
      );
    }

    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      // Generate new OTP for verification
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

      console.log(`[OTP] Re-sent for ${email}: ${otp}`);

      return NextResponse.json({
        requiresVerification: true,
        message: 'Silakan verifikasi email Anda terlebih dahulu',
        devOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
      });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'user' | 'admin',
    });

    // Return user data (excluding password)
    const { password: _, ...userData } = user;

    return NextResponse.json({
      message: 'Login berhasil',
      token,
      user: userData,
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
