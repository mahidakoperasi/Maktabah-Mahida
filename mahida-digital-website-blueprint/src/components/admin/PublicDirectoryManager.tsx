'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  EMPTY_PUBLIC_DIRECTORY,
  type ContactLink,
  type PublicDirectory,
  type SocialLink,
} from '@/lib/public-directory';

export default function PublicDirectoryManager() {
  const [form, setForm] = useState<PublicDirectory>(EMPTY_PUBLIC_DIRECTORY);
  const [commerceWhatsapp, setCommerceWhatsapp] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/public-directory', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? 'Gagal memuat pengaturan');
        if (active) {
          setForm(data.directory);
          setCommerceWhatsapp(data.commerceWhatsappNumber ?? '');
        }
      })
      .catch((error) => { if (active) setMessage(error.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);

  function updateSocial(id: string, patch: Partial<SocialLink>) {
    setForm((current) => ({ ...current, socials: current.socials.map((item) =>
      item.id === id ? { ...item, ...patch } : item) }));
  }

  function updateContact(id: string, patch: Partial<ContactLink>) {
    setForm((current) => ({ ...current, contacts: current.contacts.map((item) =>
      item.id === id ? { ...item, ...patch } : item) }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/public-directory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Gagal menyimpan pengaturan');
      setForm(result.directory);
      setMessage('Pengaturan tersimpan. Tautan aktif ditampilkan di footer dan halaman Kontak.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal menyimpan pengaturan');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="max-w-5xl space-y-8">
      <div>
        <p className="label mb-2">Tampilan Website</p>
        <h1 className="font-serif text-3xl font-bold text-charcoal">Media Sosial &amp; Kontak</h1>
        <p className="mt-2 text-sm text-warm-gray-600">Kelola tujuan resmi Mahida. Entri tersembunyi atau belum diisi tidak ditampilkan ke pengunjung.</p>
      </div>
      {message && <p role="status" className="border border-mahida-200 bg-white p-3 text-sm">{message}</p>}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl font-bold">Media sosial pondok</h2>
          <button type="button" className="btn-secondary" onClick={() => setForm((current) => ({
            ...current,
            socials: [...current.socials, {
              id: crypto.randomUUID(), platform: 'instagram', label: '', url: '', isVisible: false,
              sortOrder: current.socials.length,
            }],
          }))}>Tambah media sosial</button>
        </div>
        {form.socials.length === 0 && <p className="empty-state text-sm">Belum ada akun media sosial.</p>}
        {form.socials.map((item) => (
          <fieldset key={item.id} className="grid gap-4 border border-mahida-200 bg-white p-5 sm:grid-cols-2">
            <legend className="sr-only">Pengaturan akun {item.label || 'baru'}</legend>
            <label className="text-sm">Platform
              <select value={item.platform} onChange={(event) => updateSocial(item.id, { platform: event.target.value as SocialLink['platform'] })} className="mt-1 w-full border p-3">
                <option value="instagram">Instagram</option><option value="youtube">YouTube</option>
                <option value="facebook">Facebook</option><option value="tiktok">TikTok</option>
                <option value="x">X</option><option value="lainnya">Lainnya</option>
              </select>
            </label>
            <label className="text-sm">Label tampil
              <input required maxLength={100} value={item.label} onChange={(event) => updateSocial(item.id, { label: event.target.value })} className="mt-1 w-full border p-3" placeholder="Instagram Mahida" />
            </label>
            <label className="text-sm sm:col-span-2">URL akun resmi (HTTPS)
              <input type="url" required={item.isVisible} value={item.url} onChange={(event) => updateSocial(item.id, { url: event.target.value })} className="mt-1 w-full border p-3" placeholder="https://www.instagram.com/..." />
            </label>
            <label className="text-sm">Urutan
              <input type="number" min={0} max={100000} required value={item.sortOrder} onChange={(event) => updateSocial(item.id, { sortOrder: Number(event.target.value) })} className="mt-1 w-full border p-3" />
            </label>
            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.isVisible} onChange={(event) => updateSocial(item.id, { isVisible: event.target.checked })} /> Tampilkan</label>
              <button type="button" className="text-sm text-red-700" onClick={() => setForm((current) => ({ ...current, socials: current.socials.filter((row) => row.id !== item.id) }))}>Hapus</button>
            </div>
          </fieldset>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl font-bold">Kontak Mahida</h2>
          <button type="button" className="btn-secondary" onClick={() => setForm((current) => ({
            ...current,
            contacts: [...current.contacts, {
              id: crypto.randomUUID(), category: 'umum', channel: 'whatsapp', label: '', value: '', isVisible: false,
              sortOrder: current.contacts.length + 1,
            }],
          }))}>Tambah kontak</button>
        </div>

        <fieldset className="grid gap-4 border border-mahida-200 bg-white p-5 sm:grid-cols-2">
          <legend className="px-1 font-semibold">WhatsApp Koperasi</legend>
          <p className="text-sm text-warm-gray-600 sm:col-span-2">Nomor aktif: {commerceWhatsapp || 'Belum diisi'}. Nomor ini tetap dikelola di <Link href="/admin/koperasi/pengaturan" className="text-emerald-forest underline">Pengaturan Koperasi</Link> dan tidak disalin ke pengaturan kontak.</p>
          <label className="text-sm">Label tampil
            <input required maxLength={100} value={form.coopWhatsapp.label} onChange={(event) => setForm((current) => ({ ...current, coopWhatsapp: { ...current.coopWhatsapp, label: event.target.value } }))} className="mt-1 w-full border p-3" />
          </label>
          <label className="text-sm">Urutan
            <input type="number" min={0} max={100000} required value={form.coopWhatsapp.sortOrder} onChange={(event) => setForm((current) => ({ ...current, coopWhatsapp: { ...current.coopWhatsapp, sortOrder: Number(event.target.value) } }))} className="mt-1 w-full border p-3" />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" disabled={!commerceWhatsapp && !form.coopWhatsapp.isVisible} checked={form.coopWhatsapp.isVisible} onChange={(event) => setForm((current) => ({ ...current, coopWhatsapp: { ...current.coopWhatsapp, isVisible: event.target.checked } }))} /> Tampilkan WhatsApp Koperasi</label>
        </fieldset>

        {form.contacts.length === 0 && <p className="empty-state text-sm">Belum ada kontak tambahan.</p>}
        {form.contacts.map((item) => (
          <fieldset key={item.id} className="grid gap-4 border border-mahida-200 bg-white p-5 sm:grid-cols-2">
            <legend className="sr-only">Pengaturan kontak {item.label || 'baru'}</legend>
            <label className="text-sm">Keperluan
              <select value={item.category} onChange={(event) => updateContact(item.id, event.target.value === 'koperasi' && item.channel === 'whatsapp' ? { category: 'koperasi', channel: 'email', value: '' } : { category: event.target.value as ContactLink['category'] })} className="mt-1 w-full border p-3">
                <option value="umum">Umum</option><option value="pendaftaran">Pendaftaran Santri</option>
                <option value="koperasi">Koperasi (selain WhatsApp)</option><option value="lainnya">Lainnya</option>
              </select>
            </label>
            <label className="text-sm">Jenis kontak
              <select value={item.channel} onChange={(event) => updateContact(item.id, { channel: event.target.value as ContactLink['channel'], value: '' })} className="mt-1 w-full border p-3">
                <option value="whatsapp" disabled={item.category === 'koperasi'}>WhatsApp</option><option value="telepon">Telepon</option>
                <option value="email">Email</option><option value="website">Tautan HTTPS</option>
              </select>
            </label>
            <label className="text-sm">Label tampil
              <input required maxLength={100} value={item.label} onChange={(event) => updateContact(item.id, { label: event.target.value })} className="mt-1 w-full border p-3" placeholder="Pendaftaran Santri" />
            </label>
            <label className="text-sm">{item.channel === 'email' ? 'Alamat email' : item.channel === 'website' ? 'URL HTTPS' : 'Nomor internasional (628..., tanpa spasi)'}
              <input type={item.channel === 'email' ? 'email' : item.channel === 'website' ? 'url' : 'text'} required={item.isVisible} value={item.value} onChange={(event) => updateContact(item.id, { value: event.target.value })} className="mt-1 w-full border p-3" />
            </label>
            <label className="text-sm">Urutan
              <input type="number" min={0} max={100000} required value={item.sortOrder} onChange={(event) => updateContact(item.id, { sortOrder: Number(event.target.value) })} className="mt-1 w-full border p-3" />
            </label>
            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.isVisible} onChange={(event) => updateContact(item.id, { isVisible: event.target.checked })} /> Tampilkan</label>
              <button type="button" className="text-sm text-red-700" onClick={() => setForm((current) => ({ ...current, contacts: current.contacts.filter((row) => row.id !== item.id) }))}>Hapus</button>
            </div>
          </fieldset>
        ))}
      </section>
      <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Mohon tunggu...' : 'Simpan pengaturan'}</button>
    </form>
  );
}
