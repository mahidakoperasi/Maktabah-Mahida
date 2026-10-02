import { NextRequest, NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { cmsPages, navigationItems } from '@/db/schema';
import { requireAdminAccess } from '@/lib/admin-auth';
import { logActivity } from '@/lib/activity-log';
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
  const admin = await requireAdminAccess(request, 'primary');
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const items = await db.select().from(navigationItems).orderBy(navigationItems.sortOrder, navigationItems.id);
  return NextResponse.json({ items });
}

async function save(request: NextRequest, edit: boolean) {
  const admin = await requireAdminAccess(request, 'primary');
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (edit && !parsed.data?.id)) return NextResponse.json({ error: 'Data menu tidak valid' }, { status: 400 });
  const { id, parentId, path, label, sortOrder, isVisible } = parsed.data;
  const [page] = await db.select({ id: cmsPages.id, status: cmsPages.status }).from(cmsPages).where(eq(cmsPages.path, path)).limit(1);
  if (!page) return NextResponse.json({ error: 'Buat halaman tujuan sebelum menambah menu' }, { status: 400 });
  if (isVisible && page.status !== 'published') return NextResponse.json({ error: 'Terbitkan halaman sebelum menampilkan menu' }, { status: 400 });
  let parentDepth = 0;
  if (parentId !== null) {
    const [parent] = await db.select().from(navigationItems).where(eq(navigationItems.id, parentId)).limit(1);
    if (!parent || parentId === id || parent.parentId === id) return NextResponse.json({ error: 'Induk menu tidak valid' }, { status: 400 });
    parentDepth = parent.parentId === null ? 0 : 1;
    if (parent.parentId !== null) {
      const [grandparent] = await db.select({ parentId: navigationItems.parentId }).from(navigationItems).where(eq(navigationItems.id, parent.parentId)).limit(1);
      if (!grandparent || grandparent.parentId !== null) return NextResponse.json({ error: 'Menu hanya mendukung tiga tingkat' }, { status: 400 });
    }
  }
  try {
    if (edit && id) {
      const [existing] = await db.select().from(navigationItems).where(eq(navigationItems.id, id)).limit(1);
      if (!existing) return NextResponse.json({ error: 'Menu tidak ditemukan' }, { status: 404 });
      if (parentId !== null) {
        const children = await db.select({ id: navigationItems.id }).from(navigationItems).where(eq(navigationItems.parentId, id));
        if (parentDepth === 1 && children.length) return NextResponse.json({ error: 'Menu tingkat ketiga tidak boleh memiliki submenu' }, { status: 400 });
        if (parentDepth === 0 && children.length) {
          const descendants = await db.select({ parentId: navigationItems.parentId }).from(navigationItems);
          if (descendants.some((row) => children.some((child) => child.id === row.parentId))) return NextResponse.json({ error: 'Perubahan ini akan membuat menu lebih dari tiga tingkat' }, { status: 400 });
        }
      }
      const [item] = await db.update(navigationItems).set({ parentId, path, label, sortOrder, isVisible }).where(eq(navigationItems.id, id)).returning();
      await logActivity({ actorId: admin.id, action: 'updated', targetType: 'navigation', targetId: item.id, summary: `Memperbarui menu: ${item.label}` });
      return NextResponse.json({ item });
    }
    const [item] = await db.insert(navigationItems).values({ parentId, path, label, sortOrder, isVisible }).returning();
    await logActivity({ actorId: admin.id, action: 'created', targetType: 'navigation', targetId: item.id, summary: `Membuat menu: ${item.label}` });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Navigation save:', error);
    return NextResponse.json({ error: 'URL menu sudah digunakan atau perubahan gagal' }, { status: 409 });
  }
}

export async function POST(request: NextRequest) { return save(request, false); }
export async function PATCH(request: NextRequest) { return save(request, true); }

export async function DELETE(request: NextRequest) {
  const admin = await requireAdminAccess(request, 'primary');
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const parsed = z.object({ id: z.number().int().positive() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  const [child] = await db.select({ id: navigationItems.id }).from(navigationItems).where(eq(navigationItems.parentId, parsed.data.id)).limit(1);
  if (child) return NextResponse.json({ error: 'Hapus submenu lebih dahulu' }, { status: 409 });
  const hidden = await db.update(navigationItems).set({ isVisible: false, revision: sql`${navigationItems.revision} + 1` }).where(eq(navigationItems.id, parsed.data.id)).returning();
  if (hidden[0]) await logActivity({ actorId: admin.id, action: 'hidden', targetType: 'navigation', targetId: hidden[0].id, summary: `Menyembunyikan menu: ${hidden[0].label}` });
  return NextResponse.json({ ok: hidden.length > 0 });
}
