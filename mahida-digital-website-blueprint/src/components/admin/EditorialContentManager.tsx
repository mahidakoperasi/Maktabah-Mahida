'use client';

import { useEffect, useState } from 'react';
import type { EditorialContent } from '@/lib/editorial-content';
import ImageUrlPreview from './ImageUrlPreview';
import { editableEditorialPath } from '@/lib/design-pages';

type Page = { path: string; title: string };

export default function EditorialContentManager() {
  const [pages, setPages] = useState<Page[]>([]);
  const [path, setPath] = useState('');
  const [content, setContent] = useState<EditorialContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const isUnit = path.startsWith('/tentang/unit-pendidikan/');

  useEffect(() => {
    fetch('/api/admin/cms/pages', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Gagal memuat daftar halaman');
        const data = await response.json();
        setPages(
          data.pages.filter((page: Page) => editableEditorialPath(page.path)),
        );
      })
      .catch((error) => setMessage(error.message));
  }, []);

  useEffect(() => {
    if (!path) return;
    let active = true;
    fetch(`/api/admin/editorial?path=${encodeURIComponent(path)}`, {
      cache: 'no-store',
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || 'Gagal memuat visual halaman');
        if (active) setContent(data.content);
      })
      .catch((error) => {
        if (active) setMessage(error.message);
      });
    return () => {
      active = false;
    };
  }, [path]);

  function updateField<K extends keyof EditorialContent>(
    key: K,
    value: EditorialContent[K],
  ) {
    setContent((old) => (old ? { ...old, [key]: value } : old));
  }

  async function save() {
    if (!content || !path) return;
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/editorial', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, ...content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menyimpan');
      setContent(data.content);
      setMessage(
        'Visual halaman berhasil disimpan. Muat ulang halaman publik untuk melihat hasilnya.',
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="text-3xl font-bold">Visual &amp; Unit Pendidikan</h1>
      <p className="text-sm text-warm-gray-600">
        Judul, pengantar, isi, dan status terbit diatur melalui Halaman &amp;
        Menu. Di sini Anda mengatur gambar dan rincian unit.
      </p>
      {message && (
        <p role="status" className="border bg-white p-3 text-sm">
          {message}
        </p>
      )}
      <label className="block text-sm">
        Pilih halaman
        <select
          className="mt-1 w-full border bg-white p-3"
          value={path}
          onChange={(event) => {
            setContent(null);
            setMessage('');
            setPath(event.target.value);
          }}
        >
          <option value="">Pilih halaman</option>
          {pages.map((page) => (
            <option value={page.path} key={page.path}>
              {page.title} — {page.path}
            </option>
          ))}
        </select>
      </label>
      {path && !content && <p>Memuat halaman...</p>}
      {content && (
        <>
          <section className="space-y-3 border bg-white p-5">
            <h2 className="text-xl font-bold">Label halaman</h2>
            <label className="block text-sm">
              Teks kecil di atas judul
              <input
                className="mt-1 w-full border p-3"
                value={content.sectionLabel}
                onChange={(e) => updateField('sectionLabel', e.target.value)}
              />
            </label>
          </section>
          <section className="space-y-4 border bg-white p-5">
            <h2 className="text-xl font-bold">Gambar halaman</h2>
            <p className="text-sm text-warm-gray-600">
              Kosongkan kolom untuk menyembunyikan media. Kliping Visual
              menyediakan urutan dan tata letak baru. Pastikan berkas Google
              Drive dapat diakses siapa saja yang memiliki tautan.
            </p>
            {content.images.map((url, index) => (
              <label className="block text-sm" key={index}>
                Gambar {index + 1}
                <input
                  className="mt-1 w-full border p-3"
                  value={url}
                  onChange={(event) =>
                    updateField(
                      'images',
                      content.images.map((old, i) =>
                        i === index ? event.target.value : old,
                      ),
                    )
                  }
                />
                <ImageUrlPreview url={url} />
              </label>
            ))}
          </section>
          {isUnit && (
            <>
              <section className="grid gap-4 border bg-white p-5 md:grid-cols-2">
                <div className="space-y-3 md:col-span-2">
                  {(
                    [
                      ['aboutVisible', 'Tampilkan Tentang Unit'],
                      ['facilitiesVisible', 'Tampilkan Fasilitas'],
                      ['registrationVisible', 'Tampilkan Ajakan Pendaftaran'],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex gap-2">
                      <input
                        type="checkbox"
                        checked={content[key]}
                        onChange={(e) => updateField(key, e.target.checked)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <h2 className="text-xl font-bold md:col-span-2">
                  Informasi unit
                </h2>
                <label className="text-sm">
                  Jenjang
                  <input
                    className="mt-1 w-full border p-3"
                    value={content.level}
                    onChange={(e) => updateField('level', e.target.value)}
                  />
                </label>
                <label className="text-sm">
                  Akreditasi
                  <input
                    className="mt-1 w-full border p-3"
                    value={content.accreditation}
                    onChange={(e) =>
                      updateField('accreditation', e.target.value)
                    }
                  />
                </label>
                <label className="text-sm">
                  Judul Tentang Unit
                  <input
                    className="mt-1 w-full border p-3"
                    value={content.aboutHeading}
                    onChange={(e) =>
                      updateField('aboutHeading', e.target.value)
                    }
                  />
                </label>
                <label className="text-sm">
                  Judul Fasilitas
                  <input
                    className="mt-1 w-full border p-3"
                    value={content.facilitiesHeading}
                    onChange={(e) =>
                      updateField('facilitiesHeading', e.target.value)
                    }
                  />
                </label>
              </section>
              <section className="space-y-4 border bg-white p-5">
                <h2 className="text-xl font-bold">Fasilitas</h2>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    updateField('facilities', [
                      ...content.facilities,
                      {
                        title: '',
                        description: '',
                        imageUrl: '',
                        visible: true,
                      },
                    ])
                  }
                >
                  Tambah fasilitas
                </button>
                <div className="grid gap-4 md:grid-cols-2">
                  {content.facilities.map((facility, index) => (
                    <div className="space-y-3 border p-4" key={index}>
                      <h3 className="font-semibold">Kotak {index + 1}</h3>
                      {(['title', 'description', 'imageUrl'] as const).map(
                        (key) => (
                          <label className="block text-sm" key={key}>
                            {key === 'title'
                              ? 'Nama fasilitas'
                              : key === 'description'
                                ? 'Deskripsi'
                                : 'Tautan gambar'}
                            <input
                              className="mt-1 w-full border p-2"
                              value={facility[key]}
                              onChange={(event) =>
                                updateField(
                                  'facilities',
                                  content.facilities.map((old, i) =>
                                    i === index
                                      ? { ...old, [key]: event.target.value }
                                      : old,
                                  ),
                                )
                              }
                            />
                          </label>
                        ),
                      )}
                      <ImageUrlPreview url={facility.imageUrl} />
                      <label className="flex gap-2">
                        <input
                          type="checkbox"
                          checked={facility.visible !== false}
                          onChange={(e) =>
                            updateField(
                              'facilities',
                              content.facilities.map((old, i) =>
                                i === index
                                  ? { ...old, visible: e.target.checked }
                                  : old,
                              ),
                            )
                          }
                        />
                        Tampilkan
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          disabled={!index}
                          onClick={() => {
                            const next = [...content.facilities];
                            [next[index - 1], next[index]] = [
                              next[index],
                              next[index - 1],
                            ];
                            updateField('facilities', next);
                          }}
                        >
                          Naik
                        </button>
                        <button
                          type="button"
                          disabled={index === content.facilities.length - 1}
                          onClick={() => {
                            const next = [...content.facilities];
                            [next[index + 1], next[index]] = [
                              next[index],
                              next[index + 1],
                            ];
                            updateField('facilities', next);
                          }}
                        >
                          Turun
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateField(
                              'facilities',
                              content.facilities.filter((_, i) => i !== index),
                            )
                          }
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <section className="space-y-3 border bg-white p-5">
                <h2 className="text-xl font-bold">Ajakan pendaftaran</h2>
                <label className="block text-sm">
                  Label bagian
                  <input
                    className="mt-1 w-full border p-3"
                    value={content.registrationLabel}
                    onChange={(event) =>
                      updateField('registrationLabel', event.target.value)
                    }
                  />
                </label>
                {(
                  [
                    ['ctaTitle', 'Judul'],
                    ['ctaLabel', 'Teks tombol'],
                    ['ctaHref', 'Tujuan tombol'],
                  ] as const
                ).map(([key, label]) => (
                  <label className="block text-sm" key={key}>
                    {label}
                    <input
                      className="mt-1 w-full border p-3"
                      value={content[key]}
                      onChange={(event) => updateField(key, event.target.value)}
                    />
                  </label>
                ))}
              </section>
            </>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="btn-primary"
          >
            {saving ? 'Menyimpan...' : 'Simpan halaman'}
          </button>
        </>
      )}
    </div>
  );
}
