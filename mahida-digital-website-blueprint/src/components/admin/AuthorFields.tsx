'use client';

import { useEffect, useState } from 'react';

type Author = { id: number; name: string; slug: string };

export default function AuthorFields({ authorId, authorClass, onChange }: {
  authorId: number | null;
  authorClass: string;
  onChange: (authorId: number | null, authorClass: string) => void;
}) {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/authors', { cache: 'no-store' }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal memuat penulis');
      if (active) setAuthors(data.authors);
    }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Gagal memuat penulis'); });
    return () => { active = false; };
  }, []);

  async function createAuthor() {
    if (!name.trim()) return;
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/admin/authors', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menambahkan penulis');
      setAuthors((previous) => [...previous, data.author].sort((a, b) => a.name.localeCompare(b.name, 'id')));
      onChange(data.author.id, authorClass);
      setName('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal menambahkan penulis'); }
    finally { setSaving(false); }
  }

  return <div className="space-y-3 border border-mahida-200 bg-white p-5">
    <h2 className="font-semibold">Kredit Penulis</h2>
    <label className="block text-sm">Penulis
      <select value={authorId ?? ''} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null, authorClass)} className="mt-1 w-full border p-3">
        <option value="">Belum ditentukan</option>
        {authors.map((author) => <option key={author.id} value={author.id}>{author.name}</option>)}
      </select>
    </label>
    <div className="flex flex-wrap gap-2">
      <input aria-label="Nama penulis baru" value={name} maxLength={255} onChange={(event) => setName(event.target.value)} placeholder="Nama penulis baru" className="min-w-0 flex-1 border p-3 text-sm" />
      <button type="button" disabled={saving || !name.trim()} onClick={createAuthor} className="btn-secondary">Tambah penulis</button>
    </div>
    <label className="block text-sm">Kelas saat karya diterbitkan (opsional)
      <input value={authorClass} maxLength={100} onChange={(event) => onChange(authorId, event.target.value)} placeholder="Contoh: Kelas X MA" className="mt-1 w-full border p-3" />
    </label>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
}
