import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Registrasi pengguna publik dinonaktifkan. Akun admin dibuat oleh admin utama.' },
    { status: 410 }
  );
}
