import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
import { pool } from '@/db';
import { sameOrigin } from '@/lib/request-origin';
import { contactSchema } from '@/lib/contact-schema';
import { contentSchema } from '@/lib/design-schema';
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: 'Asal permintaan tidak valid' },
      { status: 403 },
    );
  const parsed = contactSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Periksa nama, email/nomor telepon, subjek dan pesan.' },
      { status: 400 },
    );
  const { rows } = await pool.query(
    "SELECT published FROM design_documents WHERE path='/tentang/kontak' AND kind='content'",
  );
  const content = contentSchema.safeParse(rows[0]?.published);
  const page = await pool.query(
    "SELECT 1 FROM cms_pages WHERE path='/tentang/kontak' AND status='published'",
  );
  if (!page.rowCount || !content.success || !content.data.contactFormEnabled)
    return NextResponse.json(
      { error: 'Formulir sedang tidak tersedia' },
      { status: 404 },
    );
  const secret = process.env.JWT_SECRET;
  if (!secret)
    return NextResponse.json({ error: 'Layanan belum siap' }, { status: 503 });
  const hash = (s: string) =>
    createHmac('sha256', secret).update(s).digest('hex');
  // Production ingress must overwrite these headers; reply-to and global quotas still apply independently.
  const network =
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unidentified';
  const quotas: [[string, number], [string, number], [string, number]] = [
    [hash('reply:' + parsed.data.replyTo.toLowerCase()), 5],
    [hash('network:' + network), 20],
    [hash('contact-global'), 100],
  ];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [key, limit] of quotas.sort((a, b) =>
      a[0].localeCompare(b[0]),
    )) {
      const count = await client.query(
        `INSERT INTO contact_rate_limits(visitor_hash,attempts) VALUES($1,1) ON CONFLICT(visitor_hash) DO UPDATE SET attempts=CASE WHEN contact_rate_limits.window_start < now()-interval '15 minutes' THEN 1 ELSE contact_rate_limits.attempts+1 END,window_start=CASE WHEN contact_rate_limits.window_start < now()-interval '15 minutes' THEN now() ELSE contact_rate_limits.window_start END RETURNING attempts`,
        [key],
      );
      if (count.rows[0].attempts > limit) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Terlalu banyak pesan. Coba kembali 15 menit lagi.' },
          { status: 429, headers: { 'Retry-After': '900' } },
        );
      }
    }
    const d = parsed.data;
    await client.query(
      'INSERT INTO contact_messages(name,reply_to,subject,message) VALUES($1,$2,$3,$4)',
      [d.name, d.replyTo, d.subject, d.message],
    );
    await client.query(
      "DELETE FROM contact_rate_limits WHERE window_start < now()-interval '1 day'",
    );
    await client.query('COMMIT');
    return NextResponse.json(
      {
        ok: true,
        message:
          'Pesan tersimpan dan masuk ke inbox Admin Mahida. Admin akan menghubungi Anda melalui kontak yang diisi.',
      },
      { status: 201 },
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Contact message failed', error);
    return NextResponse.json(
      { error: 'Pesan belum tersimpan. Coba kembali.' },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
