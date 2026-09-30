'use client';
import { useEffect, useState } from 'react';
type Message = {
  id: number;
  name: string;
  reply_to: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
};
export default function ContactInbox() {
  const [messages, setMessages] = useState<Message[]>([]),
    [offset, setOffset] = useState(0),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    fetch(`/api/admin/contact?offset=${offset}`, { cache: 'no-store' })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (active) setMessages(d.messages);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [offset]);
  return (
    <div className="max-w-4xl space-y-5">
      <h1 className="text-3xl font-bold">Pesan Kontak</h1>
      <p>
        Balas melalui kontak pengirim, lalu tandai selesai. Data ini hanya
        tersedia untuk Admin.
      </p>
      {error && <p role="alert">{error}</p>}
      {messages.map((m) => (
        <article
          key={m.id}
          className="space-y-3 break-words border bg-white p-5"
        >
          <h2 className="text-xl font-bold">{m.subject}</h2>
          <p>
            {m.name} — {m.reply_to}
          </p>
          <p className="text-xs">
            {new Date(m.created_at).toLocaleString('id-ID')} ·{' '}
            {m.status === 'handled' ? 'Selesai' : 'Baru'}
          </p>
          <p className="whitespace-pre-wrap">{m.message}</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={async () => {
              const status = m.status === 'handled' ? 'new' : 'handled';
              try {
                const r = await fetch('/api/admin/contact', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: m.id, status }),
                });
                if (!r.ok) throw Error('Gagal memperbarui pesan');
                setMessages(
                  messages.map((x) => (x.id === m.id ? { ...x, status } : x)),
                );
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Gagal');
              }
            }}
          >
            {m.status === 'handled' ? 'Tandai baru' : 'Tandai selesai'}
          </button>
        </article>
      ))}
      {!messages.length && <p>Belum ada pesan pada halaman ini.</p>}
      <div className="flex gap-3">
        <button disabled={!offset} onClick={() => setOffset(offset - 50)}>
          Sebelumnya
        </button>
        <button
          disabled={messages.length < 50}
          onClick={() => setOffset(offset + 50)}
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}
