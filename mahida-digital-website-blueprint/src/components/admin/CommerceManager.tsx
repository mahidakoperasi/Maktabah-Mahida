'use client';

import { useEffect, useState } from 'react';
import type { CommerceSettings } from '@/lib/commerce';
import { driveIdFromUrl } from '@/lib/media-links';
const blank: CommerceSettings = { whatsappNumber: '', merchantName: '', qrisImageUrl: '', qrisEnabled: false, youtubeChannelUrl: '' };
export default function CommerceManager() {
  const [form, setForm] = useState<CommerceSettings>(blank);
  const [message, setMessage] = useState('');
  useEffect(() => { fetch('/api/admin/commerce', { cache: 'no-store' }).then((response) => response.json()).then((result) => setForm(result.settings ?? blank)).catch(() => setMessage('Gagal memuat pengaturan')); }, []);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch('/api/admin/commerce', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const result = await response.json();
    setMessage(response.ok ? 'Pengaturan tersimpan.' : result.error || 'Gagal menyimpan');
  }
  return <form onSubmit={save} className="max-w-3xl space-y-5 border bg-white p-6"><h1 className="font-serif text-3xl font-bold">Kanal &amp; Pembayaran</h1>{message && <p role="status" className="bg-mahida-50 p-3">{message}</p>}
    <label className="block text-sm">Nomor WhatsApp koperasi (format internasional, contoh 628... tanpa +)<input value={form.whatsappNumber} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} className="mt-1 w-full border p-3" /></label>
    <label className="block text-sm">Nama merchant pada QRIS<input value={form.merchantName} onChange={(e) => setForm({ ...form, merchantName: e.target.value })} className="mt-1 w-full border p-3" /></label>
    <label className="block text-sm">URL QRIS resmi (Google Drive)<input value={form.qrisImageUrl} onChange={(e) => setForm({ ...form, qrisImageUrl: e.target.value })} className="mt-1 w-full border p-3" /></label>
    {driveIdFromUrl(form.qrisImageUrl) && <div className="max-w-sm"><iframe title="Pratinjau QRIS" src={`https://drive.google.com/file/d/${driveIdFromUrl(form.qrisImageUrl)}/preview`} className="aspect-square w-full border" /><a href={form.qrisImageUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-forest">Periksa gambar QRIS di Drive ↗</a></div>}
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.qrisEnabled} onChange={(e) => setForm({ ...form, qrisEnabled: e.target.checked })} /> QRIS sudah tersedia, diuji, dan pesanan e-book boleh dibuka</label>
    <p className="text-xs text-warm-gray-600">Saat ini QRIS belum tersedia. Biarkan kotak di atas tidak dicentang; pengunjung tidak dapat membuat pesanan e-book.</p>
    <label className="block text-sm">URL kanal YouTube Mahida<input value={form.youtubeChannelUrl} onChange={(e) => setForm({ ...form, youtubeChannelUrl: e.target.value })} className="mt-1 w-full border p-3" /></label>
    <button type="submit" className="btn-primary">Simpan pengaturan</button>
  </form>;
}
