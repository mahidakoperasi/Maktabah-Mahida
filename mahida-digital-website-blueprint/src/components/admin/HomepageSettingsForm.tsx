'use client';

import { useEffect, useState } from 'react';
import type { HomepageSettings } from '@/lib/homepage-settings';
import ImageUrlPreview from './ImageUrlPreview';

const fields = {
  hero: [
    ['heroEyebrow', 'Teks kecil'],
    ['heroTitleLine1', 'Judul baris 1'],
    ['heroTitleLine2', 'Judul baris 2'],
    ['heroTitleAccent', 'Judul aksen'],
    ['heroDescription', 'Deskripsi'],
    ['heroPrimaryLabel', 'Teks tombol utama'],
    ['heroPrimaryHref', 'Tujuan tombol utama'],
    ['heroSecondaryLabel', 'Teks tombol kedua'],
    ['heroSecondaryHref', 'Tujuan tombol kedua'],
  ] as const,
  units: [
    ['unitsEyebrow', 'Teks kecil'],
    ['unitsTitle', 'Judul'],
    ['unitsDescription', 'Deskripsi'],
  ] as const,
  news: [
    ['newsEyebrow', 'Teks kecil'],
    ['newsTitle', 'Judul'],
  ] as const,
};

export default function HomepageSettingsForm() {
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [articles, setArticles] = useState<
    { id: number; title: string; type: string }[]
  >([]);

  useEffect(() => {
    fetch('/api/admin/homepage', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Gagal memuat Beranda');
        setSettings(data.settings);
        setReady(Boolean(data.ready));
        setArticles(data.articles ?? []);
      })
      .catch((error) => setMessage(error.message));
  }, []);

  function update<K extends keyof HomepageSettings>(
    key: K,
    value: HomepageSettings[K],
  ) {
    setSettings((old) => (old ? { ...old, [key]: value } : old));
  }

  function toggleArticle(id: number) {
    if (!settings) return;
    const ids = settings.homePostIds;
    update(
      'homePostIds',
      ids.includes(id)
        ? ids.filter((item) => item !== id)
        : ids.length < 3
          ? [...ids, id]
          : ids,
    );
  }

  function moveArticle(index: number, direction: -1 | 1) {
    if (
      !settings ||
      index + direction < 0 ||
      index + direction >= settings.homePostIds.length
    )
      return;
    const next = [...settings.homePostIds];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    update('homePostIds', next);
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Gagal menyimpan Beranda');
      setSettings(data.settings);
      setMessage(
        'Beranda berhasil disimpan. Muat ulang halaman publik untuk melihat hasilnya.',
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return <p>{message || 'Memuat pengaturan Beranda...'}</p>;
  if (!ready)
    return <p role="alert">Database pengaturan Beranda belum siap.</p>;
  const input = ([key, label]: readonly [keyof HomepageSettings, string]) => (
    <label className="block text-sm" key={key}>
      {label}
      <input
        className="mt-1 w-full border p-3"
        value={settings[key] as string}
        onChange={(event) => update(key, event.target.value as never)}
      />
    </label>
  );
  return (
    <div className="space-y-6">
      <p className="text-sm">
        Urutan publik: Hero → Karya-karya Terbaru → Pendidikan Mahida. Status
        tampil diatur melalui Bagian Konten Resmi; media baru melalui Kliping
        Visual.
      </p>
      {message && (
        <p role="status" className="border bg-white p-3 text-sm">
          {message}
        </p>
      )}
      <section className="space-y-3 border bg-white p-5">
        <h2 className="text-xl font-bold">Identitas Website</h2>
        {(
          [
            ['siteName', 'Nama di navbar dan footer'],
            ['siteTagline', 'Subjudul footer'],
            ['footerDescription', 'Deskripsi footer'],
            ['seoTitle', 'Judul utama mesin pencari'],
            ['seoDescription', 'Deskripsi utama mesin pencari'],
          ] as const
        ).map(input)}
        <label className="block text-sm">
          Logo transparan PNG/WebP/SVG (HTTPS atau Google Drive)
          <input
            className="mt-1 w-full border p-3"
            value={settings.siteLogoUrl}
            onChange={(event) => update('siteLogoUrl', event.target.value)}
          />
          <ImageUrlPreview url={settings.siteLogoUrl} />
          <span className="mt-2 block text-xs">
            Gunakan berkas transparan. Jika putih menyatu pada gambar, ganti
            aset melalui kolom ini; warna asli logo tidak diubah dengan CSS.
          </span>
        </label>
      </section>
      <section className="space-y-4 border bg-white p-5">
        <h2 className="text-xl font-bold">Hero Beranda</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {fields.hero.map(input)}
        </div>
        <label className="block text-sm">
          Gambar latar (HTTPS atau Google Drive)
          <input
            className="mt-1 w-full border p-3"
            value={settings.heroImageUrl}
            onChange={(e) => update('heroImageUrl', e.target.value)}
          />
          <ImageUrlPreview url={settings.heroImageUrl} />
        </label>
        <label className="block text-sm">
          Video latar (MP4 HTTPS atau Google Drive)
          <input
            className="mt-1 w-full border p-3"
            value={settings.heroVideoUrl}
            onChange={(e) => update('heroVideoUrl', e.target.value)}
          />
          <span className="mt-1 block text-xs text-warm-gray-600">
            Drive memakai poster dan tombol Putar; tidak dijanjikan autoplay.
            MP4 HTTPS memakai muted/loop/playsInline, bergantung browser dan
            akses sumber. Foto hero menjadi poster/fallback. Kosongkan untuk
            menampilkan foto.
          </span>
        </label>
      </section>
      <section className="space-y-3 border bg-white p-5">
        <h2 className="text-xl font-bold">Pendidikan Mahida</h2>
        {fields.units.map(input)}
        <p className="text-sm text-warm-gray-600">
          Nama dan urutan unit mengikuti pengaturan Halaman &amp; Menu.
        </p>
      </section>
      <section className="space-y-3 border bg-white p-5">
        <h2 className="text-xl font-bold">Karya-karya Terbaru</h2>
        {fields.news.map(input)}
        <p className="text-sm text-warm-gray-600">
          Pilih hingga tiga tulisan terbit. Jika tidak ada pilihan, tiga tulisan
          terbaru tampil otomatis. Sampul mengikuti gambar unggulan di Konten.
        </p>
        <div className="max-h-64 space-y-2 overflow-y-auto border p-3">
          {articles.map((article) => (
            <label key={article.id} className="flex gap-3 text-sm">
              <input
                type="checkbox"
                checked={settings.homePostIds.includes(article.id)}
                disabled={
                  !settings.homePostIds.includes(article.id) &&
                  settings.homePostIds.length >= 3
                }
                onChange={() => toggleArticle(article.id)}
              />
              {article.title} (
              {article.type === 'essay'
                ? 'Esai & Opini'
                : article.type === 'work'
                  ? 'Karya'
                  : 'Artikel'}
              )
            </label>
          ))}
        </div>
        {settings.homePostIds.map((id, index) => (
          <div key={id} className="flex items-center gap-2 border p-2 text-sm">
            <span className="flex-1">
              {index + 1}.{' '}
              {articles.find((article) => article.id === id)?.title ??
                'Tulisan tidak tersedia'}
            </span>
            <button
              type="button"
              aria-label={`Naikkan tulisan ${index + 1}`}
              disabled={index === 0}
              onClick={() => moveArticle(index, -1)}
              className="border px-3 py-2 disabled:opacity-40"
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`Turunkan tulisan ${index + 1}`}
              disabled={index === settings.homePostIds.length - 1}
              onClick={() => moveArticle(index, 1)}
              className="border px-3 py-2 disabled:opacity-40"
            >
              ↓
            </button>
          </div>
        ))}
      </section>
      <button
        type="button"
        disabled={saving}
        onClick={save}
        className="btn-primary"
      >
        {saving ? 'Menyimpan...' : 'Simpan Beranda'}
      </button>
    </div>
  );
}
