'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ImageUrlPreview from './ImageUrlPreview';

type Author = { id: number; slug: string; name: string; bio: string | null; photo: string | null; institution: string | null };

export default function AuthorsManager() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [selected, setSelected] = useState<Author | null>(null);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const response = await fetch('/api/admin/authors', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Gagal memuat penulis');
    setAuthors(data.authors);
    return data.authors as Author[];
  }

  useEffect(() => {
    let active = true;
    fetch('/api/admin/authors', { cache: 'no-store' }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal memuat penulis');
      if (active) setAuthors(data.authors);
    }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Gagal memuat penulis'); });
    return () => { active = false; };
  }, []);

  async function submit(method: 'POST' | 'PATCH', payload: unknown) {
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/admin/authors', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menyimpan penulis');
      const rows = await refresh();
      setSelected(rows.find((row) => row.id === data.author.id) ?? null);
      setNewName(''); setNotice('Profil penulis berhasil disimpan.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal menyimpan penulis'); }
    finally { setSaving(false); }
  }

  return <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
    <div className="space-y-3"><label className="block text-sm font-semibold">Tambah Penulis<input value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={255} className="mt-2 w-full border p-3 font-normal" placeholder="Nama lengkap" /></label>
      <button type="button" className="btn-secondary" disabled={saving || !newName.trim()} onClick={() => submit('POST', { name: newName })}>Tambah</button>
      {authors.map((author) => <button key={author.id} type="button" onClick={() => setSelected(author)} className="block w-full border border-mahida-200 bg-white p-3 text-left font-semibold hover:bg-mahida-50">{author.name}</button>)}
    </div>
    <div className="min-w-0 space-y-4 border border-mahida-200 bg-white p-5 sm:p-7">
      {!selected ? <p className="text-warm-gray-600">Pilih penulis untuk memperbarui profilnya.</p> : <form onSubmit={(event) => { event.preventDefault(); submit('PATCH', { ...selected, bio: selected.bio || '', photo: selected.photo || '', institution: selected.institution || '' }); }} className="space-y-4">
        <Link className="text-sm text-emerald-700 underline" href={`/penulis/${selected.slug}`} target="_blank">Lihat arsip penulis ↗</Link>
        <label className="block text-sm font-semibold">Nama<input required value={selected.name} onChange={(event) => setSelected({ ...selected, name: event.target.value })} className="mt-2 w-full border p-3 font-normal" /></label>
        <label className="block text-sm font-semibold">Bio<textarea value={selected.bio || ''} onChange={(event) => setSelected({ ...selected, bio: event.target.value })} rows={4} className="mt-2 w-full border p-3 font-normal" /></label>
        <label className="block text-sm font-semibold">Sekolah atau lembaga<input value={selected.institution || ''} onChange={(event) => setSelected({ ...selected, institution: event.target.value })} className="mt-2 w-full border p-3 font-normal" /></label>
        <label className="block text-sm font-semibold">Foto profil (URL HTTPS atau Google Drive)<input value={selected.photo || ''} onChange={(event) => setSelected({ ...selected, photo: event.target.value })} className="mt-2 w-full border p-3 font-normal" /></label>
        <ImageUrlPreview url={selected.photo || ''} />
        <button className="btn-primary" disabled={saving} type="submit">Simpan profil</button>
      </form>}
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {notice && <p role="status" className="text-emerald-700">{notice}</p>}
    </div>
  </div>;
}
