'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ContentSection } from '@/lib/content-sections';

type Item = { id: number; title: string; slug: string; excerpt: string | null; content: string | null; featuredImage: string | null; status: string };
const blank = { title: '', excerpt: '', content: '', featuredImage: '', status: 'draft' };

export default function ContentManager({ section, label, publicPath }: { section: ContentSection; label: string; publicPath: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<{ id?: number; title: string; excerpt: string; content: string; featuredImage: string; status: string }>(blank);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const endpoint = `/api/admin/content/${section}`;

  async function refresh() {
    const response = await fetch(endpoint, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Gagal memuat konten');
    setItems(data.items);
  }
  useEffect(() => {
    let active = true;
    fetch(endpoint, { cache: 'no-store' }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal memuat konten');
      if (active) setItems(data.items);
    }).catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [endpoint]);

  async function submit(method: string, payload: unknown) {
    setSaving(true); setError('');
    try {
      const response = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menyimpan konten');
      await refresh();
      setForm(blank);
    } catch (err) { setError(err instanceof Error ? err.message : 'Gagal menyimpan'); }
    finally { setSaving(false); }
  }
  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_1.1fr]">
      <section className="space-y-4">
        <div><h1 className="font-serif text-3xl font-bold">{label}</h1><p className="mt-1 text-sm text-warm-gray-600">{items.length} konten dalam modul ini.</p></div>
        {items.length === 0 && <p className="bg-white p-5 text-sm">Belum ada konten. Tulis dan terbitkan dari formulir ini.</p>}
        {items.map((item) => <button key={item.id} onClick={() => setForm({ id: item.id, title: item.title, excerpt: item.excerpt ?? '', content: item.content ?? '', featuredImage: item.featuredImage ?? '', status: item.status === 'published' ? 'published' : 'draft' })} className="block w-full border border-mahida-200 bg-white p-4 text-left hover:bg-mahida-50"><span className="font-semibold">{item.title}</span><span className="ml-2 text-xs text-warm-gray-500">{item.status}</span></button>)}
      </section>
      <form onSubmit={(event) => { event.preventDefault(); submit(form.id ? 'PATCH' : 'POST', form); }} className="space-y-4 border border-mahida-200 bg-white p-5">
        <div className="flex items-center justify-between"><h2 className="font-serif text-xl font-bold">{form.id ? 'Edit konten' : 'Konten baru'}</h2><button className="text-sm text-emerald-forest" type="button" onClick={() => setForm(blank)}>Baru</button></div>
        {error && <p role="alert" className="bg-red-50 p-3 text-red-700">{error}</p>}
        <label className="block text-sm">Judul<input required maxLength={500} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full border p-3" /></label>
        <label className="block text-sm">Ringkasan<textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="mt-1 w-full border p-3" rows={3} /></label>
        <label className="block text-sm">Isi tulisan{section === 'terjemahan' && <span className="ml-2 text-xs text-warm-gray-500">Pisahkan paragraf Arab dan terjemahan dengan baris kosong.</span>}<textarea required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="mt-1 min-h-72 w-full border p-3" dir="auto" /></label>
        <label className="block text-sm">URL gambar Google Drive (opsional)<input value={form.featuredImage} onChange={(e) => setForm({ ...form, featuredImage: e.target.value })} className="mt-1 w-full border p-3" /></label>
        <label className="block text-sm">Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 w-full border p-3"><option value="draft">Draft</option><option value="published">Terbit</option></select></label>
        <div className="flex flex-wrap items-center gap-4"><button disabled={saving} type="submit" className="btn-primary">Simpan</button>{form.id && <button type="button" className="text-sm text-red-700" onClick={() => { if (confirm('Hapus konten ini?')) submit('DELETE', { id: form.id }); }}>Hapus</button>}{form.id && form.status === 'published' && <Link target="_blank" className="text-sm text-emerald-forest" href={`${publicPath}/${items.find((i) => i.id === form.id)?.slug ?? ''}`}>Lihat di web</Link>}</div>
      </form>
    </div>
  );
}
