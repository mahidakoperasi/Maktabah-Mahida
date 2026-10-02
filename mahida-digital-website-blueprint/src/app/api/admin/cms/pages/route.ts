import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { cmsPages, navigationItems } from '@/db/schema';
import { requireAdminAccess } from '@/lib/admin-auth';
import { logActivity } from '@/lib/activity-log';
import { validCmsPath, validNewCmsPath } from '@/lib/cms';

const inputSchema = z.object({
  id: z.number().int().positive().optional(),
  path: z.string().trim().max(255).refine(validCmsPath),
  title: z.string().trim().min(1).max(255),
  intro: z.string().trim().max(2000).default(''),
  body: z.string().trim().max(150000).default(''),
  status: z.enum(['draft', 'published']).default('draft'),
});

export async function GET(request: NextRequest) {
  const admin = await requireAdminAccess(request, 'primary');
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const pages = await db.select().from(cmsPages).orderBy(cmsPages.path);
  return NextResponse.json({ pages });
}

async function save(request: NextRequest, edit: boolean) {
  const admin = await requireAdminAccess(request, 'primary');
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (edit && !parsed.data?.id)) return NextResponse.json({ error: 'Data halaman tidak valid' }, { status: 400 });
  const { id, path, title, intro, body, status } = parsed.data;
  if (!edit && !validNewCmsPath(path)) return NextResponse.json({ error: 'URL halaman baru berbenturan dengan rute yang sudah ada. Pilih nama URL lain.' }, { status: 400 });
  try {
    if (edit && id) {
      const [existing] = await db.select().from(cmsPages).where(eq(cmsPages.id, id));
      if (!existing) return NextResponse.json({ error: 'Halaman tidak ditemukan' }, { status: 404 });
      if (existing.isSystem && existing.path !== path) return NextResponse.json({ error: 'URL halaman sistem tidak bisa diubah' }, { status: 400 });
      if (existing.path !== path) {
        if (!validNewCmsPath(path)) return NextResponse.json({ error: 'URL baru berbenturan dengan rute yang sudah ada' }, { status: 400 });
        const [menu] = await db.select({ id: navigationItems.id }).from(navigationItems).where(eq(navigationItems.path, existing.path)).limit(1);
        if (menu) return NextResponse.json({ error: 'Pindahkan menu ke URL baru sebelum mengganti URL halaman' }, { status: 409 });
      }
      const [page] = await db.update(cmsPages).set({ path, title, intro, body, status, updatedAt: new Date() }).where(eq(cmsPages.id, id)).returning();
      await logActivity({ actorId: admin.id, action: status === 'published' ? 'published' : 'updated', targetType: 'page', targetId: page.id, summary: `Memperbarui halaman: ${page.title}` });
      return NextResponse.json({ page });
    }
    const [page] = await db.insert(cmsPages).values({ path, title, intro, body, status }).returning();
    await logActivity({ actorId: admin.id, action: status === 'published' ? 'published' : 'created', targetType: 'page', targetId: page.id, summary: `${status === 'published' ? 'Menerbitkan' : 'Membuat'} halaman: ${page.title}` });
    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    console.error('CMS page save:', error);
    return NextResponse.json({ error: 'URL sudah digunakan atau halaman gagal disimpan' }, { status: 409 });
  }
}

export async function POST(request: NextRequest) { return save(request, false); }
export async function PATCH(request: NextRequest) { return save(request, true); }

export async function DELETE(request: NextRequest) {
  const admin = await requireAdminAccess(request, 'primary');
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const parsed = z.object({ id: z.number().int().positive() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  const [page] = await db.select().from(cmsPages).where(eq(cmsPages.id, parsed.data.id));
  if (!page || page.isSystem) return NextResponse.json({ error: 'Halaman sistem tidak dapat dihapus' }, { status: 400 });
  const [menu] = await db.select({ id: navigationItems.id }).from(navigationItems).where(eq(navigationItems.path, page.path)).limit(1);
  if (menu) return NextResponse.json({ error: 'Hapus menu yang mengarah ke halaman ini dahulu' }, { status: 409 });
  await db.update(cmsPages).set({ status: 'archived', updatedAt: new Date(), revision: page.revision + 1 }).where(eq(cmsPages.id, page.id));
  await logActivity({ actorId: admin.id, action: 'archived', targetType: 'page', targetId: page.id, summary: `Mengarsipkan halaman: ${page.title}` });
  return NextResponse.json({ ok: true });
}
