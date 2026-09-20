'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Save, Send, Trash2 } from 'lucide-react';

type VideoData = {
  id: number;
  title: string;
  slug: string;
  videoId: string;
  description: string | null;
  thumbnailUrl: string | null;
  featured: boolean | null;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
};

export default function YouTubeEditor({ videoId: recordId }: { videoId?: number }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(Boolean(recordId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!recordId) return;
    let active = true;
    fetch(`/api/admin/media/youtube/${recordId}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Gagal memuat video');
        return data.video as VideoData;
      })
      .then((video) => {
        if (!active) return;
        setTitle(video.title ?? '');
        setYoutubeUrl(`https://www.youtube.com/watch?v=${video.videoId}`);
        setDescription(video.description ?? '');
        setThumbnailUrl(video.thumbnailUrl ?? '');
        setFeatured(Boolean(video.featured));
        setStatus(video.status === 'published' ? 'published' : 'draft');
        setSlug(video.slug ?? '');
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Gagal memuat video'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [recordId]);

  async function save(nextStatus: 'draft' | 'published') {
    setError('');
    setNotice('');
    if (!title.trim() || !youtubeUrl.trim()) {
      setError('Judul dan link YouTube wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(recordId ? `/api/admin/media/youtube/${recordId}` : '/api/admin/media/youtube', {
        method: recordId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, youtubeUrl, description, thumbnailUrl, featured, status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menyimpan video');
      setStatus(data.video.status === 'published' ? 'published' : 'draft');
      setSlug(data.video.slug ?? '');
      setThumbnailUrl(data.video.thumbnailUrl ?? '');
      setNotice(nextStatus === 'published' ? 'Video berhasil diterbitkan.' : 'Draft video berhasil disimpan.');
      if (!recordId) router.replace(`/admin/media/youtube/${data.video.id}/edit`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan video');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!recordId || !window.confirm('Hapus video ini secara permanen?')) return;
    setSaving(true);
    const response = await fetch(`/api/admin/media/youtube/${recordId}`, { method: 'DELETE' });
    if (response.ok) {
      router.replace('/admin/media/youtube');
      router.refresh();
      return;
    }
    const data = await response.json();
    setError(data.error || 'Gagal menghapus video');
    setSaving(false);
  }

  if (loading) return <p className="text-sm text-warm-gray-500">Memuat video...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <Link href="/admin/media/youtube" className="mb-2 inline-flex items-center gap-2 text-sm text-warm-gray-500 hover:text-emerald-forest">
            <ArrowLeft size={15} /> Daftar YouTube
          </Link>
          <h1 className="text-2xl font-serif font-bold text-charcoal">{recordId ? 'Edit Video' : 'Video YouTube Baru'}</h1>
          <p className="mt-1 text-sm text-warm-gray-500">{status === 'published' ? 'Sudah diterbitkan' : 'Masih berupa draft'}{slug ? ` • /${slug}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {recordId && youtubeUrl && <Link href={youtubeUrl} target="_blank" rel="noreferrer" className="btn-secondary"><ExternalLink size={16} /> Lihat</Link>}
          {recordId && <button type="button" onClick={remove} disabled={saving} className="inline-flex items-center gap-2 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} /> Hapus</button>}
          <button type="button" onClick={() => save('draft')} disabled={saving} className="btn-secondary"><Save size={16} /> Simpan Draft</button>
          <button type="button" onClick={() => save('published')} disabled={saving} className="btn-primary"><Send size={16} /> {status === 'published' ? 'Perbarui Terbitan' : 'Terbitkan'}</button>
        </div>
      </div>

      {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="border border-warm-gray-200 bg-white p-5">
            <label className="mb-2 block text-sm font-semibold text-charcoal">Judul Video</label>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Judul video..." className="w-full border border-warm-gray-300 px-4 py-3 text-lg font-semibold outline-none focus:border-emerald-forest" />
          </div>
          <div className="border border-warm-gray-200 bg-white p-5">
            <label className="mb-2 block text-sm font-semibold text-charcoal">Link YouTube</label>
            <input value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} placeholder="https://youtu.be/... atau https://youtube.com/watch?v=..." className="w-full border border-warm-gray-300 px-4 py-3 outline-none focus:border-emerald-forest" />
            <p className="mt-2 text-xs text-warm-gray-400">Link video biasa, Shorts, Live, dan youtu.be dapat digunakan.</p>
          </div>
          <div className="border border-warm-gray-200 bg-white p-5">
            <label className="mb-2 block text-sm font-semibold text-charcoal">Deskripsi</label>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={8} placeholder="Deskripsi singkat video..." className="w-full resize-y border border-warm-gray-300 px-4 py-3 leading-7 outline-none focus:border-emerald-forest" />
          </div>
        </div>
        <aside className="space-y-5">
          <div className="border border-warm-gray-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-charcoal">Thumbnail</h2>
            {thumbnailUrl && <div className="mb-3 aspect-video bg-cover bg-center" style={{ backgroundImage: `url(${thumbnailUrl})` }} />}
            <input value={thumbnailUrl} onChange={(event) => setThumbnailUrl(event.target.value)} placeholder="Kosongkan untuk thumbnail YouTube" className="w-full border border-warm-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-forest" />
          </div>
          <label className="flex cursor-pointer items-start gap-3 border border-warm-gray-200 bg-white p-5">
            <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} className="mt-1" />
            <span><strong className="block text-sm text-charcoal">Video unggulan</strong><span className="mt-1 block text-xs text-warm-gray-500">Diprioritaskan pada bagian utama Mahida TV.</span></span>
          </label>
        </aside>
      </div>
    </div>
  );
}
