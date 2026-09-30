'use client';

import { useEffect, useState } from 'react';

type MediaItem = { id: number; title: string; slug: string; description: string | null; youtubeId?: string; status: string; images?: { imageUrl: string; caption: string | null }[] };
type Form = { id?: number; title: string; description: string; url: string; imagesText: string; status: string };
const blank: Form = { title: '', description: '', url: '', imagesText: '', status: 'draft' };

export default function MediaManager({ kind }: { kind: 'video' | 'galeri' }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [form, setForm] = useState<Form>(blank);
  const [message, setMessage] = useState('');
  const endpoint = `/api/admin/media/${kind}`;
  async function load() {
    const response = await fetch(endpoint, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Gagal memuat media');
    setItems(data.items);
  }
  useEffect(() => {
    let active = true;
    fetch(endpoint, { cache: 'no-store' }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal memuat media');
      if (active) setItems(data.items);
    }).catch((error) => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, [endpoint]);
  async function submit(method: string, payload: unknown) {
    setMessage('');
    try {
      const response = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menyimpan');
      await load(); setForm(blank); setMessage('Perubahan disimpan.');
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Gagal menyimpan'); }
  }
  return <div className="grid gap-8 xl:grid-cols-2">
    <section className="space-y-3"><h1 className="font-serif text-3xl font-bold">{kind === 'video' ? 'Video YouTube' : 'Galeri Foto'}</h1><p className="text-sm text-warm-gray-600">Konten draft tidak akan terlihat oleh pengunjung.</p>{items.length === 0 && <p className="empty-state">Belum ada media.</p>}{items.map((item) => <button key={item.id} className="block w-full border bg-white p-4 text-left" onClick={() => setForm({ id: item.id, title: item.title, description: item.description ?? '', url: item.youtubeId ? `https://www.youtube.com/watch?v=${item.youtubeId}` : '', imagesText: item.images?.map((image) => `${image.imageUrl}${image.caption ? ` | ${image.caption}` : ''}`).join('\n') ?? '', status: item.status })}>{item.title} <small>({item.status})</small></button>)}</section>
    <form className="space-y-4 border bg-white p-5" onSubmit={(event) => { event.preventDefault(); const images = form.imagesText.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => { const [url, ...parts] = line.split('|'); return { url: url.trim(), caption: parts.join('|').trim() }; }); submit(form.id ? 'PATCH' : 'POST', { ...form, images }); }}>
      <div className="flex justify-between"><h2 className="font-serif text-xl font-bold">{form.id ? 'Edit' : 'Tambah'}</h2><button type="button" onClick={() => setForm(blank)} className="text-emerald-forest">Baru</button></div>
      {message && <p role="status" className="bg-mahida-50 p-3 text-sm">{message}</p>}
      <label className="block text-sm">Judul<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full border p-3" /></label>
      <label className="block text-sm">Keterangan<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full border p-3" /></label>
      {kind === 'video' ? <label className="block text-sm">URL YouTube<input required type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="mt-1 w-full border p-3" placeholder="https://www.youtube.com/watch?v=..." /></label>
        : <label className="block text-sm">URL foto Google Drive, satu per baris. Tambahkan | keterangan setelah URL.<textarea required value={form.imagesText} onChange={(e) => setForm({ ...form, imagesText: e.target.value })} className="mt-1 min-h-40 w-full border p-3" /></label>}
      <label className="block text-sm">Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 w-full border p-3"><option value="draft">Draft</option><option value="published">Terbit</option></select></label>
      <div className="flex gap-4"><button type="submit" className="btn-primary">Simpan</button>{form.id && <button type="button" className="text-red-700" onClick={() => { if (confirm('Hapus media ini?')) submit('DELETE', { id: form.id }); }}>Hapus</button>}</div>
    </form>
  </div>;
}
