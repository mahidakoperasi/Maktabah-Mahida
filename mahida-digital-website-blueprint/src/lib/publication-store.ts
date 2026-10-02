import 'server-only';
import { cache } from 'react';
import { createHash } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { NextRequest } from 'next/server';
import type { PoolClient } from 'pg';
import { pool } from '@/db';
import { requireAdminAccess } from './admin-auth';
import { PRIMARY_ADMIN_EMAIL } from './admin-config';
import { canAccess, type StoredAdminAccess } from './admin-permissions';
import { mediaSchema, contentSchema } from './design-schema';
import { gallerySchema, visibleGalleryPhotos } from './gallery-schema';
import { legacyGallery } from './gallery-store';
import { checkDriveImages, markerImages } from './drive-image-check';
import { invalidDriveImages, invalidVideoMarkers } from './rich-markers';
import { publicationSchema, type Publication } from './publication-schema';
import { calculateReadingTime } from './utils';
export class PublicationError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
type Query = Pick<PoolClient, 'query'>;
export function requiredScope(target: string) {
  return target.startsWith('page:')
    ? 'primary'
    : target.startsWith('gallery:')
      ? 'media'
      : 'content';
}
export async function readSource(client: Query, target: string, lock = false) {
  const suffix = lock ? ' FOR UPDATE' : '';
  const [kind, ...parts] = target.split(':');
  const key = parts.join(':');
  if (kind === 'page') {
    const page = (
      await client.query(
        "SELECT * FROM cms_pages WHERE path=$1 AND status<>'archived'" + suffix,
        [key],
      )
    ).rows[0];
    if (!page) throw new PublicationError('Halaman tidak ditemukan', 404);
    const docs = (
      await client.query(
        'SELECT * FROM design_documents WHERE path=$1 ORDER BY kind' + suffix,
        [key],
      )
    ).rows;
    const content = docs.find((d) => d.kind === 'content');
    const media = docs.find((d) => d.kind === 'media');
    const parse = (raw: unknown, schema: typeof mediaSchema | typeof contentSchema) =>
      raw == null ? null : schema.parse(raw);
    const base = {
      type: 'page',
      path: key,
      title: page.title,
      intro: page.intro ?? '',
      body: page.body ?? '',
    };
    return {
      draft: publicationSchema.parse({
        ...base,
        content: parse(content ? content.draft : null, contentSchema),
        media: parse(media ? media.draft : null, mediaSchema),
      }),
      published: publicationSchema.parse({
        ...base,
        content: parse(content?.published, contentSchema),
        media: parse(media?.published, mediaSchema),
      }),
      publicPath: key,
      status: page.status,
      contentUpdatedAt: content?.updated_at,
      mediaUpdatedAt: media?.updated_at,
      source: createHash('sha256')
        .update(JSON.stringify([page, docs]))
        .digest('hex'),
    };
  }
  if (kind === 'gallery') {
    const album = (
      await client.query('SELECT * FROM galleries WHERE id=$1' + suffix, [Number(key)])
    ).rows[0];
    if (!album) throw new PublicationError('Album tidak ditemukan', 404);
    const doc = (
      await client.query('SELECT * FROM gallery_documents WHERE gallery_id=$1' + suffix, [
        album.id,
      ])
    ).rows[0];
    const fallback = await legacyGallery(client, album.id);
    const wrap = (data: unknown) =>
      publicationSchema.parse({ type: 'gallery', id: album.id, data });
    return {
      draft: wrap(doc?.draft ?? fallback),
      published: wrap(doc?.published ?? fallback),
      publicPath: `/media/galeri/${album.slug}`,
      status: album.status,
      source: createHash('sha256')
        .update(JSON.stringify([album, doc, fallback]))
        .digest('hex'),
    };
  }
  const post = (
    await client.query(
      "SELECT * FROM posts WHERE id=$1 AND type='announcement'" + suffix,
      [Number(key)],
    )
  ).rows[0];
  if (!post) throw new PublicationError('Pengumuman tidak ditemukan', 404);
  const data = publicationSchema.parse({
    type: 'announcement',
    id: post.id,
    title: post.title,
    excerpt: post.excerpt ?? '',
    content: post.content_raw ?? post.content ?? '',
    featuredImage: post.featured_image ?? '',
  });
  return {
    draft: data,
    published: data,
    publicPath: `/media/pengumuman/${post.slug}`,
    status: post.status,
    source: createHash('sha256').update(JSON.stringify(post)).digest('hex'),
  };
}
export async function validatePublication(data: Publication) {
  const images: string[] = [];
  if (data.type === 'page') {
    const text = [
      data.body,
      ...(data.content?.sections.filter((s) => s.enabled).map((s) => s.body) ?? []),
    ].join('\n');
    if (invalidDriveImages(text) || invalidVideoMarkers(text))
      throw new PublicationError('Periksa tautan gambar/video pada teks sebelum terbit.');
    images.push(...markerImages(text));
    if (data.media) {
      images.push(
        data.media.headerLogoUrl ?? '',
        ...data.media.clips.flatMap((c) => [c.type === 'image' ? c.url : '', c.poster]),
      );
      if (
        data.media.clips.some((c) => c.area.startsWith('card-') && data.path !== '/media')
      )
        throw new PublicationError('Area kartu hanya tersedia pada halaman Media.');
      const ids = new Set([
        'page-body',
        ...(data.content?.sections.map((s) => s.id) ?? []),
      ]);
      if (data.media.clips.some((c) => c.area === 'inline' && !ids.has(c.afterSection)))
        throw new PublicationError(
          'Ada foto/video yang merujuk bagian teks yang belum tersedia. Periksa pasangan teks dan media.',
        );
    }
    if (
      data.content?.featuredVideoId &&
      !(
        await pool.query("SELECT 1 FROM videos WHERE id=$1 AND status='published'", [
          data.content.featuredVideoId,
        ])
      ).rowCount
    )
      throw new PublicationError('Video sorotan harus sudah terbit.');
  } else if (data.type === 'gallery') {
    const photos = visibleGalleryPhotos(data.data);
    if (!photos.length)
      throw new PublicationError('Pilih dan tampilkan minimal satu foto sebelum terbit.');
    images.push(...photos.map((p) => p.imageUrl));
  } else {
    if (invalidDriveImages(data.content) || invalidVideoMarkers(data.content))
      throw new PublicationError('Periksa tautan media dalam pengumuman.');
    images.push(data.featuredImage, ...markerImages(data.content));
  }
  await checkDriveImages(images);
}
// Atomic public projections preserve every newer private draft.
export async function projectPublication(client: Query, data: Publication) {
  if (data.type === 'page') {
    await client.query(
      "UPDATE cms_pages SET title=$2,intro=$3,body=$4,status='published',revision=revision+1,updated_at=now() WHERE path=$1",
      [data.path, data.title, data.intro, data.body],
    );
    for (const kind of ['content', 'media'] as const) {
      const value = JSON.stringify(data[kind]);
      await client.query(
        'INSERT INTO design_documents(path,kind,draft,published) VALUES($1,$2,$3::jsonb,$3::jsonb) ON CONFLICT(path,kind) DO UPDATE SET published=$3::jsonb,revision=design_documents.revision+1,updated_at=now()',
        [data.path, kind, value],
      );
    }
  } else if (data.type === 'gallery') {
    await client.query(
      'INSERT INTO gallery_documents(gallery_id,draft,published) VALUES($1,$2::jsonb,$2::jsonb) ON CONFLICT(gallery_id) DO UPDATE SET published=$2::jsonb,revision=gallery_documents.revision+1,updated_at=now()',
      [data.id, JSON.stringify(data.data)],
    );
    await client.query(
      "UPDATE galleries SET title=$2,description=$3,status='published',revision=revision+1,updated_at=now() WHERE id=$1",
      [data.id, data.data.title, data.data.description],
    );
    await client.query('DELETE FROM gallery_images WHERE gallery_id=$1', [data.id]);
    for (const [order, photo] of visibleGalleryPhotos(data.data).entries())
      await client.query(
        'INSERT INTO gallery_images(gallery_id,image_url,caption,sort_order) VALUES($1,$2,$3,$4)',
        [data.id, photo.imageUrl, photo.caption, order],
      );
  } else {
    await client.query(
      "UPDATE posts SET title=$2,excerpt=$3,content=$4,content_raw=$4,featured_image=$5,status='published',published_at=coalesce(published_at,now()),reading_time=$6,revision=revision+1,updated_at=now() WHERE id=$1 AND type='announcement'",
      [
        data.id,
        data.title,
        data.excerpt,
        data.content,
        data.featuredImage || null,
        calculateReadingTime(data.content),
      ],
    );
  }
}
export async function recordPublication(
  client: Query,
  target: string,
  row: { history: unknown[] },
  previous: Publication,
  status: string,
  actor: number | null,
  action: string,
) {
  const history = [
    { at: new Date().toISOString(), by: actor, status, data: previous },
    ...row.history,
  ].slice(0, 20);
  await client.query(
    'UPDATE publication_documents SET history=$2::jsonb,scheduled=NULL,scheduled_at=NULL,scheduled_by=NULL,scheduled_error=NULL,revision=revision+1,updated_at=now() WHERE target=$1',
    [target, JSON.stringify(history)],
  );
  await client.query(
    "INSERT INTO activity_logs(actor_id,action,target_type,target_id,summary) VALUES($1,$2,'publication',$3,$4)",
    [actor, action, target.slice(0, 80), `${action}: ${target}`.slice(0, 500)],
  );
}
// Run once per public request, under row locks. No cron dependency or public mutation endpoint.
// A due snapshot appears on the first request at/after its scheduled instant.
export const flushScheduledPublications = cache(async () => {
  if (!process.env.DATABASE_URL) return;
  const due = await pool.query(
    'SELECT target FROM publication_documents WHERE scheduled_at<=now() ORDER BY scheduled_at LIMIT 3',
  );
  for (const item of due.rows) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const row = (
        await client.query(
          'SELECT * FROM publication_documents WHERE target=$1 AND scheduled_at<=now() FOR UPDATE SKIP LOCKED',
          [item.target],
        )
      ).rows[0];
      if (!row) {
        await client.query('ROLLBACK');
        continue;
      }
      const actor = (
        await client.query(
          "SELECT * FROM users WHERE id=$1 AND role='admin' AND email_verified=true",
          [row.scheduled_by],
        )
      ).rows[0];
      if (
        !actor ||
        !canAccess(
          actor.admin_access as StoredAdminAccess,
          requiredScope(row.target),
          actor.email.toLowerCase() === PRIMARY_ADMIN_EMAIL,
        )
      )
        throw new PublicationError(
          'Jadwal dihentikan: hak penerbit tidak lagi tersedia.',
        );
      const data = publicationSchema.parse(row.scheduled);
      await validatePublication(data);
      const previous = await readSource(client, row.target, true);
      if (previous.status === 'archived')
        throw new PublicationError('Jadwal dihentikan: konten telah diarsipkan.');
      await projectPublication(client, data);
      await recordPublication(
        client,
        row.target,
        row,
        previous.published,
        previous.status,
        actor.id,
        'published',
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      // Only cancel the same due schedule; a concurrently replaced future schedule survives.
      await pool.query(
        'UPDATE publication_documents SET scheduled=NULL,scheduled_at=NULL,scheduled_by=NULL,scheduled_error=$2,revision=revision+1 WHERE target=$1 AND scheduled_at<=now()',
        [
          item.target,
          error instanceof Error
            ? error.message.slice(0, 500)
            : 'Jadwal gagal; draf dan terbitan lama tetap tersimpan.',
        ],
      );
    } finally {
      client.release();
    }
  }
});
export const getPublicationPreview = cache(
  async (target: string): Promise<Publication | null> => {
    if ((await headers()).get('x-mahida-publication-preview') !== target) return null;
    const admin = await requireAdminAccess(
      new NextRequest('https://mahida.invalid', {
        headers: { cookie: (await cookies()).toString() },
      }),
      requiredScope(target),
    );
    if (!admin) return null;
    const row = (
      await pool.query('SELECT draft FROM publication_documents WHERE target=$1', [
        target,
      ])
    ).rows[0];
    const parsed = publicationSchema.safeParse(row?.draft);
    return parsed.success ? parsed.data : null;
  },
);
