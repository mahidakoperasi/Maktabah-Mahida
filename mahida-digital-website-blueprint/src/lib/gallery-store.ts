import 'server-only';
import { pool } from '@/db';
import { gallerySchema, galleryPhotoSchema, visibleGalleryPhotos, type GalleryData } from './gallery-schema';
import type { PoolClient } from 'pg';

export async function legacyGallery(client: Pick<PoolClient, 'query'>, id: number): Promise<GalleryData | null> {
  const { rows } = await client.query('SELECT title,description FROM galleries WHERE id=$1', [id]);
  if (!rows[0]) return null;
  const images = await client.query('SELECT id,image_url,caption FROM gallery_images WHERE gallery_id=$1 ORDER BY sort_order,id', [id]);
  return gallerySchema.parse({ title: rows[0].title, description: rows[0].description ?? '', photos: images.rows.map((p) => galleryPhotoSchema.parse({ id: `legacy-${p.id}`, imageUrl: p.image_url, caption: p.caption ?? '' })) });
}

export async function publicGallery(id: number): Promise<GalleryData | null> {
  const { rows } = await pool.query('SELECT published FROM gallery_documents WHERE gallery_id=$1', [id]);
  if (!rows[0]) return null; // Caller preserves the legacy gallery renderer.
  const parsed = gallerySchema.safeParse(rows[0].published);
  // Filter on the SERVER, before React serializes props into public HTML/RSC.
  // Hiding in a client component alone would still leak unselected photo URLs.
  return parsed.success ? { ...parsed.data, photos: visibleGalleryPhotos(parsed.data) } : null;
}
