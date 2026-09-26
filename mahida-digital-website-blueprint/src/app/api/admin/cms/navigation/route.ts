import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { cmsPages, navigationItems } from '@/db/schema';
import { getAdminUser } from '@/lib/admin-auth';
import { validCmsPath } from '@/lib/cms';

const inputSchema = z.object({
  id: z.number().int().positive().optional(),
  parentId: z.number().int().positive().nullable().default(null),
  path: z.string().trim().max(255).refine(validCmsPath),
  label: z.string().trim().min(1).max(100),
  sortOrder: z.number().int().min(0).max(100000),
  isVisible: z.boolean(),
});

export async function GET(request: NextRequest) {
  if (!await getAdminUser(request)) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const items = await db.select().from(navigationItems).orderBy(navigationItems.sortOrder, navigationItems.id);
  return NextResponse.json({ items });
}

async function save(request: NextRequest, edit: boolean) {
  if (!await getAdminUser(request)) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (edit && !parsed.data?.id)) return NextResponse.json({ error: 'Data menu tidak valid' }, { status: 400 });
  const { id, parentId, path, label, sortOrder, isVisible } = parsed.data;
  const [page] = await db.select({ id: cmsPages.id, status: cmsPages.status }).from(cmsPages).where(eq(cmsPages.path, path)).limit(1);
  if (!page) return NextResponse.json({ error: 'Buat halaman tujuan sebelum menambah menu' }, { status: 400 });
  if (isVisible && page.status !== 'published') return NextResponse.json({ error: 'Terbitkan halaman sebelum menampilkan menu' }, { status: 400 });
  if (parentId !== null) {
    const [parent] = await db.select().from(navigationItems).where(eq(navigationItems.id, parentId)).limit(1);
    if (!parent || parent.parentId !== null || parentId === id) return NextResponse.json({ error: 'Induk menu harus menu tingkat atas' }, { status: 400 });
  }
  try {
    if (edit && id) {
      const [existing] = await db.select().from(navigationItems).where(eq(navigationItems.id, id)).limit(1);
      if (!existing) return NextResponse.json({ error: 'Menu tidak ditemukan' }, { status: 404 });
      if (parentId !== null) {
        const [child] = await db.select({ id: navigationItems.id }).from(navigationItems).where(eq(navigationItems.parentId, id)).limit(1);
        if (child) return NextResponse.json({ error: 'Menu dengan submenu tidak dapat menjadi submenu' }, { status: 400 });
      }
      const [item] = await db.update(navigationItems).set({ parentId, path, label, sortOrder, isVisible }).where(eq(navigationItems.id, id)).returning();
      return NextResponse.json({ item });
    }
    const [item] = await db.insert(navigationItems).values({ parentId, path, label, sortOrder, isVisible }).returning();
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Navigation save:', error);
    return NextResponse.json({ error: 'URL menu sudah digunakan atau perubahan gagal' }, { status: 409 });
  }
}

export async function POST(request: NextRequest) { return save(request, false); }
export async function PATCH(request: NextRequest) { return save(request, true); }

export async function DELETE(request: NextRequest) {
  if (!await getAdminUser(request)) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const parsed = z.object({ id: z.number().int().positive() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  const [child] = await db.select({ id: navigationItems.id }).from(navigationItems).where(eq(navigationItems.parentId, parsed.data.id)).limit(1);
  if (child) return NextResponse.json({ error: 'Hapus submenu lebih dahulu' }, { status: 409 });
  const deleted = await db.delete(navigationItems).where(eq(navigationItems.id, parsed.data.id)).returning();
  return NextResponse.json({ ok: deleted.length > 0 });
}
