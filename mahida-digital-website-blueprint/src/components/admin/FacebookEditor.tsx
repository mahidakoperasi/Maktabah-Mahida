'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Save, Send, Trash2 } from 'lucide-react';

type FacebookData = {
  id: number;
  postUrl: string;
  caption: string | null;
  imageUrl: string | null;
  featured: boolean | null;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
};

export default function FacebookEditor({ postId }: { postId?: number }) {
  const router = useRouter();
  const [postUrl, setPostUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [loading, setLoading] = useState(Boolean(postId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!postId) return;
    let active = true;
    fetch(`/api/admin/media/facebook/${postId}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Gagal memuat postingan');
        return data.post as FacebookData;
      })
      .then((post) => {
        if (!active) return;
        setPostUrl(post.postUrl ?? '');
        setCaption(post.caption ?? '');
        setImageUrl(post.imageUrl ?? '');
        setFeatured(Boolean(post.featured));
        setStatus(post.status === 'published' ? 'published' : 'draft');
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Gagal memuat postingan'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [postId]);

  async function save(nextStatus: 'draft' | 'published') {
    setError('');
    setNotice('');
    if (!postUrl.trim() || !caption.trim()) {
      setError('Link Facebook dan caption wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(postId ? `/api/admin/media/facebook/${postId}` : '/api/admin/media/facebook', {
        method: postId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postUrl, caption, imageUrl, featured, status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menyimpan postingan');
      setStatus(data.post.status === 'published' ? 'published' : 'draft');
      setNotice(nextStatus === 'published' ? 'Postingan berhasil diterbitkan.' : 'Draft berhasil disimpan.');
      if (!postId) router.replace(`/admin/media/facebook/${data.post.id}/edit`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan postingan');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!postId || !window.confirm('Hapus postingan Facebook ini secara permanen?')) return;
    setSaving(true);
    const response = await fetch(`/api/admin/media/facebook/${postId}`, { method: 'DELETE' });
    if (response.ok) {
      router.replace('/admin/media/facebook');
      router.refresh();
      return;
    }
    const data = await response.json();
    setError(data.error || 'Gagal menghapus postingan');
    setSaving(false);
  }

  if (loading) return <p className="text-sm text-warm-gray-500">Memuat postingan...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <Link href="/admin/media/facebook" className="mb-2 inline-flex items-center gap-2 text-sm text-warm-gray-500 hover:text-emerald-forest"><ArrowLeft size={15} /> Daftar Facebook</Link>
          <h1 className="text-2xl font-serif font-bold text-charcoal">{postId ? 'Edit Postingan' : 'Postingan Facebook Baru'}</h1>
          <p className="mt-1 text-sm text-warm-gray-500">{status === 'published' ? 'Sudah diterbitkan' : 'Masih berupa draft'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {postId && postUrl && <Link href={postUrl} target="_blank" rel="noreferrer" className="btn-secondary"><ExternalLink size={16} /> Buka Facebook</Link>}
          {postId && <button type="button" onClick={remove} disabled={saving} className="inline-flex items-center gap-2 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} /> Hapus</button>}
          <button type="button" onClick={() => save('draft')} disabled={saving} className="btn-secondary"><Save size={16} /> Simpan Draft</button>
          <button type="button" onClick={() => save('published')} disabled={saving} className="btn-primary"><Send size={16} /> {status === 'published' ? 'Perbarui Terbitan' : 'Terbitkan'}</button>
        </div>
      </div>
      {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="border border-warm-gray-200 bg-white p-5">
            <label className="mb-2 block text-sm font-semibold text-charcoal">Link Postingan Facebook</label>
            <input value={postUrl} onChange={(event) => setPostUrl(event.target.value)} placeholder="https://www.facebook.com/..." className="w-full border border-warm-gray-300 px-4 py-3 outline-none focus:border-emerald-forest" />
          </div>
          <div className="border border-warm-gray-200 bg-white p-5">
            <label className="mb-2 block text-sm font-semibold text-charcoal">Caption</label>
            <textarea value={caption} onChange={(event) => setCaption(event.target.value)} rows={12} placeholder="Tulis atau salin caption postingan..." className="w-full resize-y border border-warm-gray-300 px-4 py-3 leading-7 outline-none focus:border-emerald-forest" />
            <p className="mt-2 text-xs text-warm-gray-400">Caption ini akan tampil sebagai ringkasan di website; pengunjung tetap diarahkan ke postingan asli.</p>
          </div>
        </div>
        <aside className="space-y-5">
          <div className="border border-warm-gray-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-charcoal">Gambar Postingan</h2>
            {imageUrl && <div className="mb-3 aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />}
            <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://..." className="w-full border border-warm-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-forest" />
            <p className="mt-2 text-xs text-warm-gray-400">Opsional. Gunakan URL gambar publik agar dapat tampil di website.</p>
          </div>
          <label className="flex cursor-pointer items-start gap-3 border border-warm-gray-200 bg-white p-5">
            <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} className="mt-1" />
            <span><strong className="block text-sm text-charcoal">Postingan unggulan</strong><span className="mt-1 block text-xs text-warm-gray-500">Diprioritaskan pada bagian Facebook di halaman Media.</span></span>
          </label>
        </aside>
      </div>
    </div>
  );
}
