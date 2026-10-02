'use client';
import { useState } from 'react';
export default function ContactForm() {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  return (
    <form
      className="max-w-2xl space-y-4 border bg-white p-5 md:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        setBusy(true);
        setMessage('');
        try {
          const r = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(new FormData(form))),
          });
          const d = await r.json();
          setMessage(d.message || d.error);
          if (r.ok) form.reset();
        } catch {
          setMessage('Pesan belum terkirim. Periksa koneksi dan coba kembali.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="text-2xl font-bold">Hubungi Kami</h2>
      <p className="text-sm">
        Pesan diterima melalui inbox Admin. Isi kontak yang dapat dihubungi
        untuk balasan.
      </p>
      {[
        ['name', 'Nama', 100],
        ['replyTo', 'Email atau nomor telepon', 200],
        ['subject', 'Subjek', 200],
      ].map(([name, label, max]) => (
        <label key={name} className="block">
          {label}
          <input
            name={String(name)}
            required
            maxLength={Number(max)}
            className="mt-1 w-full border p-3"
            autoComplete={name === 'name' ? 'name' : undefined}
          />
        </label>
      ))}
      <label className="block">
        Pesan
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          className="mt-1 w-full border p-3"
        />
      </label>
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <button type="submit" data-analytics-action="contact-submit" disabled={busy} className="btn-primary">
        {busy ? 'Mengirim...' : 'Kirim Pesan'}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
