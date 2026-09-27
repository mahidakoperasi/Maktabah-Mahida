'use client';

import { useCallback, useEffect, useState } from 'react';

type Comment = { id: number; kind: string; entityId: number; author: string; body: string; status: string; createdAt: string };
export default function CommentManager() {
  const [items, setItems] = useState<Comment[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const load = useCallback(async () => {
    const response = await fetch('/api/admin/comments', { cache: 'no-store' });
    if (!response.ok) throw new Error('Komentar gagal dimuat');
    setItems((await response.json()).comments);
  }, []);
  useEffect(() => {
    let active = true;
    fetch('/api/admin/comments', { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) throw new Error('Komentar gagal dimuat');
      return response.json();
    }).then((data) => { if (active) setItems(data.comments); }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, []);
  async function act(id: number, action: 'publish' | 'delete') {
    setBusy(id); setError('');
    try {
      const response = await fetch('/api/admin/comments', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) });
      if (!response.ok) throw new Error('Gagal mengubah komentar');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal menyimpan'); }
    finally { setBusy(null); }
  }
  return <div className="mx-auto max-w-4xl space-y-4"><h1 className="font-serif text-3xl font-bold">Moderasi Komentar</h1>
    <p className="text-sm text-warm-gray-600">Komentar tamu hanya tampil setelah diterbitkan. Menampilkan 100 komentar terbaru.</p>
    {error && <p role="alert" className="bg-red-50 p-3 text-red-700">{error}</p>}
    {!items.length && <p className="empty-state">Belum ada komentar.</p>}
    {items.map((item) => <article key={item.id} className="min-w-0 space-y-3 rounded border bg-white p-4"><div className="flex flex-wrap items-center gap-2 text-sm"><strong>{item.author}</strong><span className="text-warm-gray-500">{item.kind} #{item.entityId} · {item.status} · {new Date(item.createdAt).toLocaleString('id-ID')}</span></div><p className="whitespace-pre-wrap break-words">{item.body}</p><div className="flex flex-wrap gap-2">{item.status === 'pending' && <button disabled={busy === item.id} className="btn-primary" onClick={() => act(item.id, 'publish')}>Terbitkan</button>}<button disabled={busy === item.id} className="min-h-11 rounded border border-red-200 px-4 text-red-700" onClick={() => act(item.id, 'delete')}>Hapus</button></div></article>)}
  </div>;
}
