// Baca saja: node scripts/audit-content.mjs [jumlah hari, default 3]
import pg from 'pg';

const days = Number(process.argv[2] ?? 3);
if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error('Jumlah hari harus 1 sampai 365');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum diatur');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const identity = await pool.query('select current_database() as database, inet_server_addr() as server');
  console.log('Host dan database aktif:', new URL(process.env.DATABASE_URL).hostname, identity.rows[0]);

  const counts = await pool.query(`
    select type, status, count(*)::integer as jumlah
    from posts group by type, status order by type, status
  `);
  console.table(counts.rows);

  const recent = await pool.query(`
    select id, title, type, status, created_at, updated_at, published_at
    from posts
    where created_at >= now() - ($1::integer * interval '1 day')
       or updated_at >= now() - ($1::integer * interval '1 day')
    order by updated_at desc limit 100
  `, [days]);
  console.log(`Konten dibuat/diperbarui ${days} hari terakhir:`);
  console.table(recent.rows);

  const pages = await pool.query(`
    select path, title, status, updated_at
    from cms_pages
    where updated_at >= now() - ($1::integer * interval '1 day')
    order by updated_at desc limit 30
  `, [days]);
  console.log('Halaman CMS yang baru diperbarui:');
  console.table(pages.rows);
} finally {
  await pool.end();
}
