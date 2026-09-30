'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import type { EngagementKind } from '@/lib/engagement';

type State = { likes: number; commentCount: number; liked: boolean; comments: { id: number; author: string; body: string; createdAt: string }[]; message?: string };

export default function DetailEngagement({ kind, id, children }: { kind: EngagementKind; id: number; children: ReactNode }) {
  const [data, setData] = useState<State | null>(null);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/engagement?kind=${kind}&id=${id}`, { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) throw new Error('Interaksi belum tersedia');
      return response.json();
    }).then((value) => { if (active) setData(value); }).catch(() => { if (active) setNotice('Interaksi belum tersedia.'); });
    return () => { active = false; };
  }, [kind, id]);

  async function action(payload: Record<string, unknown>) {
    setBusy(true); setNotice('');
    try {
      const response = await fetch('/api/engagement', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, id, ...payload }) });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || 'Gagal menyimpan');
      setData(value);
      if (payload.action === 'comment') { setBody(''); setNotice(value.message); }
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Gagal menyimpan'); }
    finally { setBusy(false); }
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: document.title, url });
      else { await navigator.clipboard.writeText(url); setNotice('Tautan berhasil disalin.'); }
    } catch (error) { if ((error as DOMException).name !== 'AbortError') setNotice('Gagal membagikan tautan.'); }
  }

  return <section className="mx-auto w-full max-w-4xl px-4 pb-14 sm:px-6" aria-label="Interaksi pembaca">
    <div className="flex flex-wrap gap-2 border-t border-mahida-200 pt-6">
      <button type="button" disabled={busy || !data} aria-pressed={data?.liked ?? false} onClick={() => action({ action: 'like' })} className="inline-flex min-h-11 items-center gap-2 rounded border border-mahida-200 bg-white px-4 text-sm text-emerald-forest disabled:opacity-50"><Heart size={18} fill={data?.liked ? 'currentColor' : 'none'} aria-hidden /> Suka ({data?.likes ?? 0})</button>
      <a href="#komentar" className="inline-flex min-h-11 items-center gap-2 rounded border border-mahida-200 bg-white px-4 text-sm text-emerald-forest"><MessageCircle size={18} aria-hidden /> Komentar ({data?.commentCount ?? 0})</a>
      <button type="button" onClick={share} className="inline-flex min-h-11 items-center gap-2 rounded border border-mahida-200 bg-white px-4 text-sm text-emerald-forest"><Share2 size={18} aria-hidden /> Bagikan</button>
    </div>
    {children}
    <section id="komentar" className="mt-10 scroll-mt-24 space-y-5" aria-labelledby="komentar-title">
      <h2 id="komentar-title" className="font-serif text-2xl font-bold">Komentar</h2>
      {notice && <p role="status" className="rounded bg-mahida-50 p-3 text-sm">{notice}</p>}
      {data?.comments.length ? data.comments.map((comment) => <article key={comment.id} className="rounded border border-mahida-200 bg-white p-4"><div className="flex flex-wrap items-center gap-2 text-sm"><strong>{comment.author}</strong><time className="text-warm-gray-500" dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleDateString('id-ID')}</time></div><p className="mt-2 whitespace-pre-wrap break-words">{comment.body}</p></article>) : <p className="text-sm text-warm-gray-600">Belum ada komentar yang diterbitkan.</p>}
      <form className="space-y-3 rounded border border-mahida-200 bg-white p-4" onSubmit={(event) => { event.preventDefault(); action({ action: 'comment', author: name, body }); }}>
        <p className="text-sm text-warm-gray-600">Komentar tamu akan ditampilkan setelah disetujui Admin.</p>
        <label className="block text-sm">Nama<input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 block w-full border p-3" autoComplete="name" /></label>
        <label className="block text-sm">Komentar<textarea required minLength={3} maxLength={1000} value={body} onChange={(event) => setBody(event.target.value)} className="mt-1 block min-h-28 w-full border p-3" /></label>
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">Kirim komentar</button>
      </form>
    </section>
  </section>;
}
