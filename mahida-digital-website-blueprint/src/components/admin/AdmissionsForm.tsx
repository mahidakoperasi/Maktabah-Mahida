'use client';

import { useEffect, useState } from 'react';

type Form = { introduction: string; steps: string; requirements: string; applicationLabel: string; applicationUrl: string };
const empty: Form = { introduction: '', steps: '', requirements: '', applicationLabel: 'Daftar Sekarang', applicationUrl: '' };

export default function AdmissionsForm() {
  const [form, setForm] = useState<Form>(empty);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/admissions', { cache: 'no-store' }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal memuat pengaturan');
      setForm({
        introduction: data.settings.introduction || '',
        steps: (data.settings.steps || []).join('\n'),
        requirements: (data.settings.requirements || []).join('\n'),
        applicationLabel: data.settings.applicationLabel || 'Daftar Sekarang',
        applicationUrl: data.settings.applicationUrl || '',
      });
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Gagal memuat pengaturan'));
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/admin/admissions', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, steps: form.steps.split('\n').map((line) => line.trim()).filter(Boolean), requirements: form.requirements.split('\n').map((line) => line.trim()).filter(Boolean) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menyimpan');
      setMessage('Informasi pendaftaran berhasil disimpan.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal menyimpan'); }
    finally { setBusy(false); }
  }

  return <form onSubmit={save} className="max-w-3xl space-y-5 border border-mahida-200 bg-white p-5 sm:p-8">
    <p className="text-sm text-warm-gray-600">Isi informasi resmi Mahida. Kosongkan alamat formulir untuk menyembunyikan tombol pendaftaran.</p>
    <label className="block text-sm font-semibold">Pengantar<textarea value={form.introduction} onChange={(event) => setForm({ ...form, introduction: event.target.value })} maxLength={3000} rows={4} className="mt-2 w-full border p-3 font-normal" /></label>
    <label className="block text-sm font-semibold">Tahapan seleksi (satu tahap per baris)<textarea value={form.steps} onChange={(event) => setForm({ ...form, steps: event.target.value })} rows={6} className="mt-2 w-full border p-3 font-normal" /></label>
    <label className="block text-sm font-semibold">Persyaratan & berkas (satu syarat per baris)<textarea value={form.requirements} onChange={(event) => setForm({ ...form, requirements: event.target.value })} rows={7} className="mt-2 w-full border p-3 font-normal" /></label>
    <label className="block text-sm font-semibold">Teks tombol<input value={form.applicationLabel} onChange={(event) => setForm({ ...form, applicationLabel: event.target.value })} required maxLength={100} className="mt-2 w-full border p-3 font-normal" /></label>
    <label className="block text-sm font-semibold">URL formulir pendaftaran<input value={form.applicationUrl} onChange={(event) => setForm({ ...form, applicationUrl: event.target.value })} placeholder="https://..." className="mt-2 w-full border p-3 font-normal" /></label>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {message && <p role="status" className="text-emerald-700">{message}</p>}
    <button disabled={busy} type="submit" className="btn-primary">Simpan Informasi Pendaftaran</button>
  </form>;
}
