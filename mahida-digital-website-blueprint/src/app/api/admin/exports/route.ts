import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { requireAdminAccess } from '@/lib/admin-auth';
import { exportKinds, asCsv, type ExportKind } from '@/lib/export-data';
const headers = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
};
const queries: Record<ExportKind, { sql: string; columns: string[] }> = {
  gallery: {
    sql: `SELECT g.id,g.title,g.slug,g.description,g.status,g.created_at,g.updated_at,d.draft,d.published,d.candidates,coalesce((SELECT jsonb_agg(jsonb_build_object('id',i.id,'image_url',i.image_url,'caption',i.caption,'sort_order',i.sort_order) ORDER BY i.sort_order,i.id) FROM gallery_images i WHERE i.gallery_id=g.id),'[]'::jsonb) AS legacy_photos FROM galleries g LEFT JOIN gallery_documents d ON d.gallery_id=g.id ORDER BY g.id LIMIT 51 OFFSET $1`,
    columns: [
      'id',
      'title',
      'slug',
      'description',
      'status',
      'created_at',
      'updated_at',
      'draft',
      'published',
      'candidates',
      'legacy_photos',
    ],
  },
  content: {
    sql: `SELECT p.id,p.title,p.slug,p.type,p.karya_category,p.excerpt,coalesce(p.content_raw,p.content) AS body,p.featured_image,p.author_id,p.status,p.published_at,p.created_at,p.updated_at,d.draft AS publication_draft FROM posts p LEFT JOIN publication_documents d ON d.target='announcement:'||p.id ORDER BY p.id LIMIT 51 OFFSET $1`,
    columns: [
      'id',
      'title',
      'slug',
      'type',
      'karya_category',
      'excerpt',
      'body',
      'featured_image',
      'author_id',
      'status',
      'published_at',
      'created_at',
      'updated_at',
      'publication_draft',
    ],
  },
  pages: {
    sql: `SELECT p.id,p.path,p.title,p.intro,p.body,p.status,p.updated_at,c.draft AS content_draft,c.published AS content_published,m.draft AS media_draft,m.published AS media_published,d.draft AS publication_draft FROM cms_pages p LEFT JOIN design_documents c ON c.path=p.path AND c.kind='content' LEFT JOIN design_documents m ON m.path=p.path AND m.kind='media' LEFT JOIN publication_documents d ON d.target='page:'||p.path ORDER BY p.id LIMIT 51 OFFSET $1`,
    columns: [
      'id',
      'path',
      'title',
      'intro',
      'body',
      'status',
      'updated_at',
      'content_draft',
      'content_published',
      'media_draft',
      'media_published',
      'publication_draft',
    ],
  },
  forms: {
    sql: 'SELECT id,name,reply_to,subject,message,status,created_at,handled_at FROM contact_messages ORDER BY id LIMIT 51 OFFSET $1',
    columns: [
      'id',
      'name',
      'reply_to',
      'subject',
      'message',
      'status',
      'created_at',
      'handled_at',
    ],
  },
  admissions: {
    sql: 'SELECT id,introduction,steps,requirements,application_label,application_url,updated_at FROM admission_settings ORDER BY id LIMIT 51 OFFSET $1',
    columns: [
      'id',
      'introduction',
      'steps',
      'requirements',
      'application_label',
      'application_url',
      'updated_at',
    ],
  },
  orders: {
    sql: 'SELECT id,code,product_id,product_name_snapshot,email,price_snapshot,status,created_at,reported_at,paid_amount,paid_at,verified_at,delivered_at FROM ebook_orders ORDER BY id LIMIT 51 OFFSET $1',
    columns: [
      'id',
      'code',
      'product_id',
      'product_name_snapshot',
      'email',
      'price_snapshot',
      'status',
      'created_at',
      'reported_at',
      'paid_amount',
      'paid_at',
      'verified_at',
      'delivered_at',
    ],
  },
  analytics: {
    sql: 'SELECT day::text,path,event,count FROM analytics_daily ORDER BY day,path,event LIMIT 51 OFFSET $1',
    columns: ['day', 'path', 'event', 'count'],
  },
};
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('kind') ?? '';
  if (!Object.hasOwn(exportKinds, name))
    return NextResponse.json(
      { error: 'Jenis ekspor tidak valid' },
      { status: 400, headers },
    );
  const kind = name as ExportKind,
    admin = await requireAdminAccess(request, exportKinds[kind].scope);
  if (!admin)
    return NextResponse.json(
      { error: 'Tidak diizinkan' },
      { status: 403, headers },
    );
  const rawOffset = request.nextUrl.searchParams.get('offset') ?? '0';
  if (!/^\d{1,7}$/.test(rawOffset) || Number(rawOffset) > 1000000)
    return NextResponse.json(
      { error: 'Offset tidak valid' },
      { status: 400, headers },
    );
  const offset = Number(rawOffset),
    format = request.nextUrl.searchParams.get('format') ?? 'json';
  if (!['json', 'csv'].includes(format))
    return NextResponse.json(
      { error: 'Format tidak valid' },
      { status: 400, headers },
    );
  const query = queries[kind],
    result = await pool.query(query.sql, [offset]);
  const rows: Record<string, unknown>[] = [];
  let bytes = 0;
  for (const row of result.rows.slice(0, 50)) {
    const length = Buffer.byteLength(
      format === 'csv' ? asCsv([row], query.columns) : JSON.stringify(row),
    );
    if (bytes + length > 8 * 1024 * 1024) break;
    rows.push(row);
    bytes += length;
  }
  if (result.rows.length && !rows.length)
    return NextResponse.json(
      {
        error:
          'Satu data terlalu besar untuk ekspor. Pecah konten atau album terlebih dahulu.',
      },
      { status: 413, headers },
    );
  const hasMore = result.rows.length > rows.length,
    nextOffset = hasMore ? offset + rows.length : null;
  const exportedAt = new Date().toISOString();
  await pool.query(
    "INSERT INTO activity_logs(actor_id,action,target_type,target_id,summary,metadata) VALUES($1,'exported','data_export',$2,$3,$4::jsonb)",
    [
      admin.id,
      kind,
      `Ekspor ${kind}: ${rows.length} data (${format})`,
      JSON.stringify({ offset, count: rows.length, format }),
    ],
  );
  const filename = `mahida-${kind}-${exportedAt.slice(0, 10)}-offset-${offset}.${format}`;
  const downloadHeaders = {
    ...headers,
    'Content-Disposition': `attachment; filename="${filename}"`,
    'X-Export-Has-More': String(hasMore),
    'X-Export-Next-Offset': nextOffset === null ? '' : String(nextOffset),
  };
  if (format === 'csv')
    return new NextResponse(asCsv(rows, query.columns), {
      headers: {
        ...downloadHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
      },
    });
  return NextResponse.json(
    {
      kind,
      exportedAt,
      offset,
      count: rows.length,
      hasMore,
      nextOffset,
      data: rows,
    },
    { headers: downloadHeaders },
  );
}
