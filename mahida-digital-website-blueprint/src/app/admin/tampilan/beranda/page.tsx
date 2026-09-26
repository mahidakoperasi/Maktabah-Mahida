import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { posts } from '@/db/schema';
import HomepageSettingsForm from '@/components/admin/HomepageSettingsForm';

export default async function HomepageAdminPage() {
  const readyResult = await db.execute(sql`
    select to_regclass('public.posts') is not null as ready
  `);
  const postsReady = Boolean((readyResult.rows?.[0] as { ready?: boolean } | undefined)?.ready);

  const articles = postsReady
    ? await db
        .select({
          id: posts.id,
          title: posts.title,
          status: posts.status,
        })
        .from(posts)
        .where(and(eq(posts.type, 'article'), eq(posts.status, 'published')))
        .orderBy(desc(posts.publishedAt))
    : [];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <p className="label mb-2">Tampilan Website</p>
        <h1 className="text-3xl font-serif font-bold text-charcoal">Beranda</h1>
        <p className="mt-2 text-sm text-warm-gray-500">
          Kendalikan konten utama homepage tanpa mengubah source code.
        </p>
      </div>

      <HomepageSettingsForm articles={articles} />
    </div>
  );
}
