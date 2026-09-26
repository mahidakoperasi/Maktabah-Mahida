'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';

type ArticleOption = {
  id: number;
  title: string;
  status: string;
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
  featuredArticleIds: number[];
};

export default function HomepageSettingsForm({ articles }: { articles: ArticleOption[] }) {
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
          setSettings(data.settings);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Gagal memuat pengaturan');
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  function update<K extends keyof HomepageSettings>(key: K, value: HomepageSettings[K]) {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  }

  function updateFeatured(index: number, value: string) {
    if (!settings) return;
    const next = [...settings.featuredArticleIds];
    const id = Number(value);
    if (id > 0) next[index] = id;
    else next.splice(index, 1);
    update('featuredArticleIds', next.filter(Boolean).slice(0, 3));
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
          <div className="grid grid-cols-2 gap-2">
            <input value={settings.heroPrimaryLabel} onChange={(e) => update('heroPrimaryLabel', e.target.value)} className="border p-3" placeholder="Label tombol utama" />
            <input value={settings.heroPrimaryHref} onChange={(e) => update('heroPrimaryHref', e.target.value)} className="border p-3" placeholder="/literasi" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={settings.heroSecondaryLabel} onChange={(e) => update('heroSecondaryLabel', e.target.value)} className="border p-3" placeholder="Label tombol kedua" />
            <input value={settings.heroSecondaryHref} onChange={(e) => update('heroSecondaryHref', e.target.value)} className="border p-3" placeholder="/tentang/profil" />
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
        <input value={settings.aboutImageUrl} onChange={(e) => update('aboutImageUrl', e.target.value)} className="w-full border p-3" placeholder="URL foto / gambar profil pondok" />

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
          <p className="text-xs text-warm-gray-400 mt-1">Pilih maksimal 3 artikel terbit. Jika kosong, homepage memakai artikel terbaru.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <select
              key={index}
              value={settings.featuredArticleIds[index] ?? ''}
              onChange={(e) => updateFeatured(index, e.target.value)}
              className="border p-3"
            >
              <option value="">Otomatis / kosong</option>
              {articles.map((article) => (
                <option key={article.id} value={article.id}>
                  {article.title}
                </option>
              ))}
            </select>
          ))}
        </div>
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
