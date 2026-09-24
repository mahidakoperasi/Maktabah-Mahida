import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Verifikasi OTP dinonaktifkan karena login hanya tersedia untuk admin.' },
    { status: 410 }
  );
}
