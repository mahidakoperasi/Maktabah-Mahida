import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const MAX_BYTES = 6 * 1024 * 1024;
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fallback = async () => new NextResponse(await readFile(path.join(process.cwd(), 'public/brand/mahida-logo.webp')), {
    headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff' },
  });
  if (!/^[\w-]{10,}$/.test(id)) return fallback();
  try {
    const response = await fetch(`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1200`, {
      signal: AbortSignal.timeout(10000), cache: 'no-store',
    });
    const type = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    if (!response.ok || !type || !allowedTypes.has(type) || Number(response.headers.get('content-length') || 0) > MAX_BYTES || !response.body) return fallback();
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); return fallback(); }
      chunks.push(value);
    }
    if (!size) return fallback();
    return new NextResponse(Buffer.concat(chunks), {
      headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=300, s-maxage=3600', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch { return fallback(); }
}
