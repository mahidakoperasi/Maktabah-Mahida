import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { getAdminUser } from '@/lib/admin-auth';
import { canAccess, type StoredAdminAccess } from '@/lib/admin-permissions';
import { PRIMARY_ADMIN_EMAIL } from '@/lib/admin-config';
import { BODY_SECTION, contentSchema, designPath } from '@/lib/design-schema';

export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (
    !admin ||
    !(['media', 'content'] as const).some((scope) =>
      canAccess(
        admin.adminAccess as StoredAdminAccess,
        scope,
        admin.email.toLowerCase() === PRIMARY_ADMIN_EMAIL,
      ),
    )
  )
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const canReviewText = canAccess(admin.adminAccess as StoredAdminAccess, 'content', admin.email.toLowerCase() === PRIMARY_ADMIN_EMAIL);
  const { rows } = await pool.query(
    "SELECT p.path,p.title,p.status,p.body,d.draft,d.published FROM cms_pages p LEFT JOIN design_documents d ON d.path=p.path AND d.kind='content' WHERE p.status<>'archived' ORDER BY p.path",
  );
  const pages = rows
    .filter((p) => designPath(p.path))
    .map((p) => {
      const parsed = contentSchema.safeParse(canReviewText ? p.draft ?? p.published : p.published);
      return {
        path: p.path,
        title: p.title,
        status: p.status,
        sections: [
          ...(p.path === '/'
            ? []
            : [
                {
                  id: BODY_SECTION,
                  title: 'Teks utama halaman',
                  enabled: Boolean(p.body?.trim()),
                },
              ]),
          ...(parsed.success
            ? parsed.data.sections.map((s) => ({
                id: s.id,
                title: s.title,
                enabled: Boolean(s.enabled && s.title && s.body.trim()),
              }))
            : []),
        ],
      };
    });
  // Only combined/full reviewers receive draft section metadata; media-only staff see published text.
  return NextResponse.json(
    { pages },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
