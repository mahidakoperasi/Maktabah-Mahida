'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { karyaPostLabel } from '@/lib/karya-post';
import ImageUrlPreview from './ImageUrlPreview';

type WorkOption = {
  id: number;
  title: string;
  status: string;
  type: string;
  karyaCategory: string | null;
};

type HomepageSettings = {
  heroEyebrow: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroTitleAccent: string;
  heroDescription: string;
  heroPrimaryLabel: string;
  heroPrimaryHref: string;
  heroSecondaryLabel: string;
  heroSecondaryHref: string;
  heroWidgetImageUrl: string;
  heroWidgetArabic: string;
  heroWidgetSubtitle: string;
  heroWidgetLayout: 'logo' | 'photo';
  aboutEyebrow: string;
  aboutTitle: string;
  aboutDescription: string;
  aboutImageUrl: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  featuredWorkIds: number[];
};

export default function HomepageSettingsForm({ works }: { works: WorkOption[] }) {
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [ready, setReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch('/api/admin/homepage', { cache: 'no-store' });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Gagal memuat pengaturan');

        if (active) {
          setReady(Boolean(data.ready));
          setSettings({ ...data.settings, featuredWorkIds: data.settings.featuredWorkIds.filter((id: number) => works.some((work) => work.id === id)) });
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Gagal memuat pengaturan');
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [works]);

  function update<K extends keyof HomepageSettings>(key: K, value: HomepageSettings[K]) {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  }

  function toggleFeatured(id: number) {
    if (!settings) return;
    const selected = settings.featuredWorkIds;
    if (!selected.includes(id) && selected.length >= 10) return;
    update('featuredWorkIds', selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);
  }

  function moveFeatured(index: number, direction: -1 | 1) {
    if (!settings || index + direction < 0 || index + direction >= settings.featuredWorkIds.length) return;
    const next = [...settings.featuredWorkIds];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    update('featuredWorkIds', next);
  }

  async function save() {
    if (!settings) return;

    setIsSaving(true);
    setNotice('');
    setError('');

    try {
      const response = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Gagal menyimpan');

      setSettings(data.settings);
      setNotice('Pengaturan beranda berhasil disimpan.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setIsSaving(false);
    }
  }

  if (!settings) {
    return <div className="text-sm text-warm-gray-500">Memuat pengaturan beranda...</div>;
  }

  if (!ready) {
    return (
      <div className="border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        Database pengaturan beranda belum aktif. Jalankan migration homepage settings di Neon terlebih dahulu.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

      <section className="bg-white border border-warm-gray-200 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-charcoal">Hero Utama</h2>
          <p className="text-xs text-warm-gray-400 mt-1">Konten paling atas di halaman Beranda.</p>
        </div>
        <input value={settings.heroEyebrow} onChange={(e) => update('heroEyebrow', e.target.value)} className="w-full border p-3" placeholder="Eyebrow" />
        <div className="grid gap-3 md:grid-cols-3">
          <input value={settings.heroTitleLine1} onChange={(e) => update('heroTitleLine1', e.target.value)} className="border p-3" placeholder="Judul baris 1" />
          <input value={settings.heroTitleLine2} onChange={(e) => update('heroTitleLine2', e.target.value)} className="border p-3" placeholder="Judul baris 2" />
          <input value={settings.heroTitleAccent} onChange={(e) => update('heroTitleAccent', e.target.value)} className="border p-3" placeholder="Judul aksen" />
        </div>
        <textarea value={settings.heroDescription} onChange={(e) => update('heroDescription', e.target.value)} rows={4} className="w-full border p-3" placeholder="Deskripsi hero" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <input value={settings.heroPrimaryLabel} onChange={(e) => update('heroPrimaryLabel', e.target.value)} className="border p-3" placeholder="Label tombol utama" />
            <input value={settings.heroPrimaryHref} onChange={(e) => update('heroPrimaryHref', e.target.value)} className="border p-3" placeholder="/literasi" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input value={settings.heroSecondaryLabel} onChange={(e) => update('heroSecondaryLabel', e.target.value)} className="border p-3" placeholder="Label tombol kedua" />
            <input value={settings.heroSecondaryHref} onChange={(e) => update('heroSecondaryHref', e.target.value)} className="border p-3" placeholder="/tentang/profil" />
          </div>
        </div>
        <div className="space-y-3 rounded border border-mahida-200 bg-mahida-50 p-4">
          <h3 className="font-semibold">Widget logo / foto hero</h3>
          <p className="text-xs text-warm-gray-600">Tempel tautan berkas foto Google Drive dengan akses publik, atau kosongkan untuk logo pondok bawaan.</p>
          <label className="block text-sm">Tautan gambar<input value={settings.heroWidgetImageUrl === '/brand/mahida-logo.webp' ? '' : settings.heroWidgetImageUrl} onChange={(e) => update('heroWidgetImageUrl', e.target.value)} className="mt-1 w-full border p-3" placeholder="https://drive.google.com/file/d/.../view" /></label>
          <ImageUrlPreview url={settings.heroWidgetImageUrl === '/brand/mahida-logo.webp' ? '' : settings.heroWidgetImageUrl} />
          <label className="block text-sm">Tampilan widget<select className="mt-1 w-full border p-3" value={settings.heroWidgetLayout} onChange={(e) => update('heroWidgetLayout', e.target.value as 'logo' | 'photo')}><option value="logo">Logo</option><option value="photo">Foto / poster</option></select></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">Teks Arab<input value={settings.heroWidgetArabic} onChange={(e) => update('heroWidgetArabic', e.target.value)} className="mt-1 w-full border p-3" /></label>
            <label className="block text-sm">Keterangan<input value={settings.heroWidgetSubtitle} onChange={(e) => update('heroWidgetSubtitle', e.target.value)} className="mt-1 w-full border p-3" /></label>
          </div>
        </div>
      </section>

      <section className="bg-white border border-warm-gray-200 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-charcoal">Tentang Mahida</h2>
          <p className="text-xs text-warm-gray-400 mt-1">Teks, visual, dan statistik ringkas di homepage.</p>
        </div>
        <input value={settings.aboutEyebrow} onChange={(e) => update('aboutEyebrow', e.target.value)} className="w-full border p-3" placeholder="Label section" />
        <input value={settings.aboutTitle} onChange={(e) => update('aboutTitle', e.target.value)} className="w-full border p-3" placeholder="Judul tentang" />
        <textarea value={settings.aboutDescription} onChange={(e) => update('aboutDescription', e.target.value)} rows={5} className="w-full border p-3" placeholder="Deskripsi tentang" />
        <label className="block text-sm">Tautan foto Tentang Mahida<input value={settings.aboutImageUrl} onChange={(e) => update('aboutImageUrl', e.target.value)} className="mt-1 w-full border p-3" placeholder="URL foto / gambar profil pondok" /></label>
        <ImageUrlPreview url={settings.aboutImageUrl} />

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['stat1Value', 'stat1Label'],
            ['stat2Value', 'stat2Label'],
            ['stat3Value', 'stat3Label'],
          ].map(([valueKey, labelKey], index) => (
            <div key={valueKey} className="border border-warm-gray-200 p-4">
              <p className="text-xs font-semibold text-warm-gray-500 mb-2">Statistik {index + 1}</p>
              <input
                value={settings[valueKey as keyof HomepageSettings] as string}
                onChange={(e) => update(valueKey as keyof HomepageSettings, e.target.value as never)}
                className="w-full border p-2.5 mb-2"
                placeholder="Isi setelah data diverifikasi"
              />
              <input
                value={settings[labelKey as keyof HomepageSettings] as string}
                onChange={(e) => update(labelKey as keyof HomepageSettings, e.target.value as never)}
                className="w-full border p-2.5"
                placeholder="Label"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-warm-gray-200 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-charcoal">Bacaan Pilihan</h2>
          <p className="text-xs text-warm-gray-400 mt-1">Pilih maksimal 10 karya terbit dari semua kategori. Jika kosong, tampilkan karya terbaru. Karya yang diarsipkan tidak akan tampil.</p>
        </div>
        <p role="status" className="text-sm text-warm-gray-600">{settings.featuredWorkIds.length} dari 10 karya dipilih</p>
        <div className="max-h-72 space-y-1 overflow-y-auto rounded border border-mahida-200 p-2">
          {works.length ? works.map((work) => <label key={work.id} className="flex min-h-11 items-center gap-3 rounded p-2 hover:bg-mahida-50">
            <input type="checkbox" checked={settings.featuredWorkIds.includes(work.id)} disabled={!settings.featuredWorkIds.includes(work.id) && settings.featuredWorkIds.length >= 10} onChange={() => toggleFeatured(work.id)} className="h-5 w-5 shrink-0 accent-emerald-forest" />
            <span className="min-w-0 break-words text-sm"><span className="mr-2 text-warm-gray-500">{karyaPostLabel(work)}</span>{work.title}</span>
          </label>) : <p className="p-3 text-sm text-warm-gray-500">Belum ada karya terbit.</p>}
        </div>
        {settings.featuredWorkIds.length > 0 && <div className="space-y-2" aria-label="Urutan Bacaan Pilihan">
          <h3 className="font-semibold">Urutan tampil</h3>
          {settings.featuredWorkIds.map((id, index) => {
            const work = works.find((item) => item.id === id);
            if (!work) return null;
            return <div key={id} className="flex min-w-0 items-center gap-2 rounded border p-2 text-sm">
              <span className="min-w-0 flex-1 break-words">{index + 1}. {work.title}</span>
              <button type="button" disabled={index === 0} onClick={() => moveFeatured(index, -1)} aria-label={`Naikkan ${work.title}`} className="min-h-11 min-w-11 rounded border disabled:opacity-40">↑</button>
              <button type="button" disabled={index === settings.featuredWorkIds.length - 1} onClick={() => moveFeatured(index, 1)} aria-label={`Turunkan ${work.title}`} className="min-h-11 min-w-11 rounded border disabled:opacity-40">↓</button>
            </div>;
          })}
        </div>}
      </section>

      <div className="flex justify-end">
        <button onClick={save} disabled={isSaving} className="btn-primary">
          <Save size={16} />
          {isSaving ? 'Menyimpan...' : 'Simpan Beranda'}
        </button>
      </div>
    </div>
  );
}
