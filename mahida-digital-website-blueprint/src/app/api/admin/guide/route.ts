import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';
import { adminGuideMarkdown } from '@/lib/admin-guide';
export async function GET(request: NextRequest) {
  if (!(await getAdminUser(request)))
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  return new NextResponse(adminGuideMarkdown(), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition':
        'attachment; filename="panduan-admin-mahida-rilis-5.md"',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
