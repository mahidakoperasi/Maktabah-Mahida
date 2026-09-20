import Link from 'next/link';
import { desc, sql } from 'drizzle-orm';
import { Play, Plus } from 'lucide-react';
import { db } from '@/db';
import { videos } from '@/db/schema';

export default async function AdminYouTubePage() {
  const readyResult = await db.execute(sql`select to_regclass('public.videos') is not null as ready`);
  const ready = Boolean((readyResult.rows?.[0] as { ready?: boolean } | undefined)?.ready);
  if (!ready) return <MigrationNotice title="YouTube" />;

  const rows = await db.select().from(videos).orderBy(desc(videos.createdAt));
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><p className="label mb-2">Media</p><h1 className="text-3xl font-serif font-bold text-charcoal">YouTube</h1><p className="mt-1 text-sm text-warm-gray-500">{rows.length} video tersimpan.</p></div>
        <Link href="/admin/media/youtube/new" className="btn-primary"><Plus size={16} /> Tambah Video</Link>
      </div>
      <div className="overflow-hidden border border-warm-gray-200 bg-white">
        {rows.length === 0 ? <Empty icon={<Play size={34} />} title="Belum ada video" text="Tambahkan konten YouTube Mahida yang sudah tersedia." /> : (
          <div className="divide-y divide-warm-gray-100">
            {rows.map((video) => (
              <div key={video.id} className="grid gap-4 px-5 py-4 md:grid-cols-[112px_1fr_110px_90px] md:items-center">
                <div className="aspect-video bg-charcoal bg-cover bg-center" style={video.thumbnailUrl ? { backgroundImage: `url(${video.thumbnailUrl})` } : undefined} />
                <div className="min-w-0"><Link href={`/admin/media/youtube/${video.id}/edit`} className="font-semibold text-charcoal hover:text-emerald-forest">{video.title}</Link><p className="mt-1 truncate text-xs text-warm-gray-400">youtube.com/watch?v={video.videoId}</p>{video.featured && <span className="mt-2 inline-flex bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">Unggulan</span>}</div>
                <Status value={video.status} />
                <Link href={`/admin/media/youtube/${video.id}/edit`} className="text-sm font-semibold text-emerald-forest hover:underline md:text-right">Edit</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MigrationNotice({ title }: { title: string }) { return <div className="space-y-6"><div><p className="label mb-2">Media</p><h1 className="text-3xl font-serif font-bold text-charcoal">{title}</h1></div><div className="border border-amber-200 bg-amber-50 p-6 text-amber-900">Database Media belum diaktifkan. Jalankan migration <code>0003_media_cms.sql</code> di Neon.</div></div>; }
function Empty({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="px-6 py-14 text-center text-warm-gray-300">{<div className="mx-auto mb-3 flex justify-center">{icon}</div>}<h2 className="font-semibold text-charcoal">{title}</h2><p className="mt-1 text-sm text-warm-gray-500">{text}</p></div>; }
function Status({ value }: { value: string }) { return <span className={`inline-flex w-fit px-2.5 py-1 text-xs font-semibold ${value === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-warm-gray-100 text-warm-gray-600'}`}>{value === 'published' ? 'Terbit' : 'Draft'}</span>; }
