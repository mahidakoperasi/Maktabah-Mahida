'use client';
import { useEffect, useState } from 'react';
import {
  defaultSectionLayout,
  mediaSchema,
  imageField,
  type Clip,
  type MediaDesign,
  type SectionLayout,
} from '@/lib/design-schema';
import Link from 'next/link';
import ImageUrlPreview from './ImageUrlPreview';
import useDraftAutosave from './useDraftAutosave';
import VisualGrid from '@/components/VisualMedia';

type Document = {
  draft: MediaDesign | null;
  published: MediaDesign | null;
  history: { at: string; data: unknown }[];
  revision: number;
};
type Page = {
  path: string;
  title: string;
  status: string;
  sections: { id: string; title: string; enabled: boolean }[];
};
type LibraryItem = { label: string; type: 'image' | 'video'; url: string };
const field =
  'mt-1 w-full min-w-0 border border-warm-gray-300 bg-white p-2.5 text-sm';
const areaLabels = {
  hero: 'Hero',
  inline: 'Sela bagian teks',
  gallery: 'Galeri halaman',
  'card-kegiatan': 'Kartu Kegiatan',
  'card-video': 'Kartu Video',
  'card-galeri': 'Kartu Galeri',
};
const layouts: { value: SectionLayout; label: string }[] = [
  { value: 'stacked', label: 'Teks lalu foto/video' },
  { value: 'text-left', label: 'Teks kiri · foto/video kanan' },
  { value: 'text-right', label: 'Foto/video kiri · teks kanan' },
];

export default function ClippingManager({ initialPath = '/tentang/profil' }: { initialPath?: string }) {
  const [pages, setPages] = useState<Page[]>([]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [path, setPath] = useState(initialPath);
  const [doc, setDoc] = useState<Document | null>(null);
  const [form, setForm] = useState<MediaDesign>({ clips: [] });
  const [baseline, setBaseline] = useState(JSON.stringify({ clips: [] }));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [preview, setPreview] = useState(false);
  const [width, setWidth] = useState(375);
  const [dragId, setDragId] = useState<string | null>(null);
  const dirty = JSON.stringify(form) !== baseline;
  const page = pages.find((p) => p.path === path);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/design/pages', { cache: 'no-store' })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw Error(data.error || 'Gagal memuat halaman');
        if (active) setPages(data.pages);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    Promise.all(
      ['/api/admin/media/galeri', '/api/admin/media/video'].map((url) =>
        fetch(url, { cache: 'no-store' }),
      ),
    )
      .then(async ([g, v]) => {
        if (!g.ok || !v.ok) return;
        const [albums, videos] = await Promise.all([g.json(), v.json()]);
        if (active)
          setLibrary([
            ...albums.items
              .filter((a: { status: string }) => a.status === 'published')
              .flatMap(
                (a: {
                  title: string;
                  images: { imageUrl: string; caption?: string }[];
                }) =>
                  a.images
                    .filter(
                      (photo) =>
                        photo.imageUrl &&
                        imageField.safeParse(photo.imageUrl).success,
                    )
                    .map((photo, i) => ({
                      label: (photo.caption || `${a.title} / ${i + 1}`).slice(
                        0,
                        200,
                      ),
                      type: 'image' as const,
                      url: photo.imageUrl,
                    })),
              ),
            ...videos.items
              .filter((v: { status: string }) => v.status === 'published')
              .map((v: { title: string; youtubeId: string }) => ({
                label: v.title,
                type: 'video' as const,
                url: `https://www.youtube.com/watch?v=${v.youtubeId}`,
              })),
          ]);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  function accept(next: Document) {
    const data = mediaSchema.parse(
      next.draft ?? next.published ?? { clips: [], useLegacyMedia: true },
    );
    setDoc(next);
    setForm(data);
    setBaseline(JSON.stringify(data));
    setConflict(false);
  }
  useEffect(() => {
    let active = true;
    fetch(`/api/admin/design?path=${encodeURIComponent(path)}&kind=media`, {
      cache: 'no-store',
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw Error(data.error || 'Gagal memuat kliping');
        if (active) accept(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function changePage(next: string) {
    if (
      dirty &&
      !confirm(
        'Ada perubahan belum disimpan. Pindah halaman dan tinggalkan perubahan ini?',
      )
    )
      return;
    setLoading(true);
    setPath(next);
    setDoc(null);
    setForm({ clips: [] });
    setBaseline(JSON.stringify({ clips: [] }));
    setPreview(false);
    setError('');
    setMessage('');
    setConflict(false);
  }
  function patch(id: string, value: Partial<Clip>) {
    setForm((f) => ({
      ...f,
      clips: f.clips.map((c) => (c.id === id ? { ...c, ...value } : c)),
    }));
  }
  function move(from: number, to: number) {
    if (
      busy ||
      loading ||
      from < 0 ||
      to < 0 ||
      to >= form.clips.length ||
      from === to
    )
      return;
    const clips = [...form.clips];
    clips.splice(to, 0, clips.splice(from, 1)[0]);
    setForm({ ...form, clips });
  }
  function layout(sectionId: string, value: SectionLayout) {
    setForm((f) => ({
      ...f,
      sectionLayouts: [
        ...(f.sectionLayouts ?? []).filter((s) => s.sectionId !== sectionId),
        { sectionId, layout: value },
      ],
    }));
  }
  async function save(
    action: 'draft' | 'publish' | 'restore',
    version?: number,
  ) {
    if (!doc) return;
    const checked = mediaSchema.safeParse(form);
    if (action !== 'restore' && !checked.success) {
      setError(checked.error.issues.map((i) => i.message).join('; '));
      return;
    }
    if (
      action === 'restore' &&
      !confirm('Pulihkan versi ini sebagai terbitan? Draf lokal akan diganti.')
    )
      return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const r = await fetch('/api/admin/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          kind: 'media',
          action,
          revision: doc.revision,
          data: form,
          version,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (r.status === 409) setConflict(true);
        throw Error(data.error || 'Gagal menyimpan kliping');
      }
      accept(data);
      setPreview(false);
      setMessage(
        action === 'draft'
          ? 'Draf tersimpan. Pengunjung tetap melihat versi terbit.'
          : 'Versi terbit diperbarui.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan kliping');
    } finally {
      setBusy(false);
    }
  }
  useDraftAutosave(dirty, busy || loading || Boolean(error) || conflict, mediaSchema.safeParse(form).success, () => save('draft'));
  async function reload() {
    if (
      dirty &&
      !confirm(
        'Muat versi terbaru? Perubahan lokal yang belum disimpan akan ditinggalkan.',
      )
    )
      return;
    setBusy(true);
    try {
      const r = await fetch(
        `/api/admin/design?path=${encodeURIComponent(path)}&kind=media`,
        { cache: 'no-store' },
      );
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      accept(data);
      setError('');
      setPreview(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat ulang');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-w-0 max-w-6xl space-y-5">
      <h1 className="text-3xl font-bold">Kliping Visual</h1>
      <p className="text-sm">
        Atur foto/video pada area halaman yang tersedia. Isi teks tetap dikelola
        melalui halaman dan Bagian Konten Resmi. Draf media terpisah dari versi
        terbit.
      </p>
      <label className="block text-sm">
        Halaman
        <select
          aria-label="Halaman"
          className={field}
          value={path}
          disabled={busy || loading}
          onChange={(e) => changePage(e.target.value)}
        >
          {!pages.length && <option value={path}>Memuat halaman…</option>}
          {pages.map((p) => (
            <option key={p.path} value={p.path}>
              {p.title} — {p.path}
              {p.status === 'draft' ? ' (draf halaman)' : ''}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p
          role="alert"
          className="border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}{' '}
          {conflict && (
            <button
              type="button"
              disabled={busy}
              className="underline"
              onClick={reload}
            >
              Muat versi terbaru
            </button>
          )}
        </p>
      )}
      {message && (
        <p role="status" className="border bg-white p-3 text-sm">
          {message}
        </p>
      )}
      {loading && <p>Memuat kliping…</p>}
      {doc && (
        <>
          <label className="block text-sm">URL Drive logo header<input className={field} disabled={busy} value={form.headerLogoUrl ?? ''} onChange={e => setForm({ ...form, headerLogoUrl: e.target.value })} /></label>
          <p className="text-xs">Kosongkan untuk menyembunyikan header. Logo ikut bergulir; menu galeri tetap tersedia.</p>
          <ImageUrlPreview url={form.headerLogoUrl ?? ''} />
          <Link className="text-sm underline" href={`/admin/tampilan/penerbitan?target=${encodeURIComponent(`page:${path}`)}`}>Tinjau teks dan media bersama (Admin Utama)</Link>
          <p className="text-sm">
            Seret pegangan untuk menyusun media di desktop; gunakan Naik/Turun
            di HP. Urutan berlaku di area yang sama. MP4 HTTPS, Drive publik dan
            YouTube didukung; poster dipakai sebelum pemutaran.
          </p>
          <button
            type="button"
            disabled={busy || form.clips.length >= 40}
            className="btn-secondary"
            onClick={() =>
              setForm({
                ...form,
                useLegacyMedia: false,
                clips: [
                  ...form.clips,
                  {
                    id: crypto.randomUUID(),
                    area: 'inline',
                    afterSection: '',
                    type: 'image',
                    url: '',
                    alt: '',
                    poster: '',
                    size: 'medium',
                    ratio: 'landscape',
                    crop: true,
                    focalX: 50,
                    focalY: 50,
                  },
                ],
              })
            }
          >
            Tambah foto/video
          </button>
          <p className="text-xs">
            {form.clips.length}/40 media. Foto/video yang dihapus dari kliping
            tetap tersedia di sumbernya.
          </p>
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            {form.clips.map((c, i) => (
              <fieldset
                key={c.id}
                disabled={busy}
                data-clip-editor={c.id}
                className={`min-w-0 space-y-3 border bg-white p-4 ${dragId === c.id ? 'opacity-60' : ''}`}
                onDragOver={(e) => {
                  if (!busy) e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id =
                    e.dataTransfer.getData('application/x-mahida-clip') ||
                    dragId;
                  if (id)
                    move(
                      form.clips.findIndex((v) => v.id === id),
                      i,
                    );
                  setDragId(null);
                }}
              >
                <legend>Media {i + 1}</legend>
                <button
                  type="button"
                  draggable={!busy}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/x-mahida-clip', c.id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDragId(c.id);
                  }}
                  onDragEnd={() => setDragId(null)}
                  className="min-h-11 cursor-grab border px-3 py-2 focus-visible:outline-2"
                >
                  Seret untuk memindah
                </button>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={i === 0}
                    className="btn-secondary"
                    onClick={() => move(i, i - 1)}
                  >
                    Naik
                  </button>
                  <button
                    type="button"
                    disabled={i === form.clips.length - 1}
                    className="btn-secondary"
                    onClick={() => move(i, i + 1)}
                  >
                    Turun
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      setForm({
                        ...form,
                        clips: form.clips.filter((v) => v.id !== c.id),
                      })
                    }
                  >
                    Hapus
                  </button>
                </div>
                <label className="block text-sm">
                  Area
                  <select
                    aria-label="Area"
                    className={field}
                    value={c.area}
                    onChange={(e) =>
                      patch(c.id, { area: e.target.value as Clip['area'] })
                    }
                  >
                    {Object.entries(areaLabels)
                      .filter(
                        ([area]) =>
                          !area.startsWith('card-') || path === '/media',
                      )
                      .map(([area, label]) => (
                        <option key={area} value={area}>
                          {label}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Pustaka media terbit
                  <select
                    aria-label="Pustaka media terbit"
                    className={field}
                    value=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const item = library[Number(e.target.value)];
                      if (item)
                        patch(c.id, {
                          url: item.url,
                          type: item.type,
                          alt: item.label,
                        });
                    }}
                  >
                    <option value="">Pilih dari galeri/video</option>
                    {library.map((item, n) => (
                      <option key={`${item.url}-${n}`} value={n}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Jenis
                  <select
                    aria-label="Jenis"
                    className={field}
                    value={c.type}
                    onChange={(e) =>
                      patch(c.id, { type: e.target.value as Clip['type'] })
                    }
                  >
                    <option value="image">Foto</option>
                    <option value="video">Video</option>
                  </select>
                </label>
                <label className="block text-sm">
                  URL media HTTPS
                  <input
                    className={field}
                    maxLength={2048}
                    value={c.url}
                    onChange={(e) => patch(c.id, { url: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  Teks alternatif / judul video
                  <input
                    className={field}
                    maxLength={200}
                    value={c.alt}
                    onChange={(e) => patch(c.id, { alt: e.target.value })}
                  />
                </label>
                {c.type === 'video' && (
                  <label className="block text-sm">
                    URL poster video
                    <input
                      className={field}
                      maxLength={2048}
                      value={c.poster}
                      onChange={(e) => patch(c.id, { poster: e.target.value })}
                    />
                  </label>
                )}
                {c.area === 'inline' && (
                  <label className="block text-sm">
                    Letakkan foto/video setelah bagian
                    <select
                      aria-label="Letakkan foto/video setelah bagian"
                      className={field}
                      value={c.afterSection}
                      onChange={(e) =>
                        patch(c.id, { afterSection: e.target.value })
                      }
                    >
                      <option value="">Sebelum bagian teks tambahan</option>
                      {page?.sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title || 'Bagian tanpa judul'}
                          {!s.enabled ? ' (belum terisi / tidak tampil)' : ''}
                        </option>
                      ))}
                      {c.afterSection &&
                        !page?.sections.some(
                          (s) => s.id === c.afterSection,
                        ) && (
                          <option value={c.afterSection}>
                            Bagian sebelumnya (tidak ditemukan)
                          </option>
                        )}
                    </select>
                  </label>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    Ukuran
                    <select
                      aria-label="Ukuran"
                      className={field}
                      value={c.size}
                      onChange={(e) =>
                        patch(c.id, { size: e.target.value as Clip['size'] })
                      }
                    >
                      <option value="small">Kecil</option>
                      <option value="medium">Sedang</option>
                      <option value="wide">Lebar</option>
                    </select>
                  </label>
                  <label className="block text-sm">
                    Rasio crop
                    <select
                      aria-label="Rasio crop"
                      className={field}
                      value={c.ratio}
                      onChange={(e) =>
                        patch(c.id, { ratio: e.target.value as Clip['ratio'] })
                      }
                    >
                      <option value="original">Asli</option>
                      <option value="landscape">Landscape</option>
                      <option value="portrait">Portrait</option>
                      <option value="square">Kotak</option>
                    </select>
                  </label>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={c.crop !== false}
                    onChange={(e) => patch(c.id, { crop: e.target.checked })}
                  />{' '}
                  Crop untuk mengisi bingkai
                </label>
                <p className="text-xs">
                  Ukuran dan rasio mengatur kartu/galeri serta media di sela
                  teks. Hero mengikuti bingkai halaman. Crop dan titik fokus
                  berlaku pada foto/poster serta MP4 dengan rasio tetap; pemutar
                  Drive/YouTube mengatur isi videonya sendiri.
                </p>
                {(['focalX', 'focalY'] as const).map((axis) => (
                  <label key={axis} className="block text-xs">
                    Titik fokus {axis === 'focalX' ? 'horizontal' : 'vertikal'}:{' '}
                    {c[axis]}%
                    <input
                      type="range"
                      className="mt-2 w-full"
                      min={0}
                      max={100}
                      value={c[axis]}
                      onChange={(e) =>
                        patch(c.id, { [axis]: Number(e.target.value) })
                      }
                    />
                  </label>
                ))}
                {c.url && <VisualGrid clips={[c]} />}
              </fieldset>
            ))}
          </div>
          <section className="min-w-0 space-y-3 border bg-white p-4">
            <h2 className="font-semibold">Tata letak teks–foto/video</h2>
            <p className="text-sm">
              Pilih bagian pada media dengan area Sela bagian teks, lalu atur
              pasangannya di sini. Pada HP, teks dan media tersusun satu kolom.
            </p>
            {page?.sections.map((s) => (
              <label key={s.id} className="block text-sm">
                {s.title || 'Bagian tanpa judul'}
                <select
                  aria-label={`Tata letak ${s.title || s.id}`}
                  disabled={busy}
                  className={field}
                  value={
                    form.sectionLayouts?.find((v) => v.sectionId === s.id)
                      ?.layout ?? defaultSectionLayout(path, s.title)
                  }
                  onChange={(e) =>
                    layout(s.id, e.target.value as SectionLayout)
                  }
                >
                  {layouts.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </section>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              className="btn-secondary"
              onClick={() => save('draft')}
            >
              Simpan Draf
            </button>
            <button
              type="button"
              disabled={busy || dirty}
              className="btn-secondary disabled:opacity-50"
              onClick={() => setPreview(!preview)}
            >
              Pratinjau Draf tersimpan
            </button>
            <button
              type="button"
              disabled={busy}
              className="btn-primary"
              onClick={() => save('publish')}
            >
              Terbitkan
            </button>
          </div>
          <p className="text-sm">
            {dirty
              ? 'Ada perubahan belum disimpan. Simpan draf dahulu untuk pratinjau halaman.'
              : 'Pratinjau hanya memakai draf media yang tersimpan dan teks versi terbit.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              [375, 'HP'],
              [768, 'Tablet'],
              [1440, 'PC'],
            ].map(([w, label]) => (
              <button
                key={w}
                type="button"
                aria-label={String(label)}
                aria-pressed={width === w}
                className="border bg-white p-3 text-sm"
                onClick={() => setWidth(Number(w))}
              >
                {label} ({w} px)
              </button>
            ))}
          </div>
          {preview && (
            <div
              data-design-preview
              className="max-w-full overflow-x-auto border"
            >
              <iframe
                key={`${path}-${doc.revision}`}
                title="Pratinjau halaman publik: draf media privat"
                src={`${path}?designPreview=1&designKind=media`}
                style={{ width, maxWidth: 'none', height: 850 }}
                className="border-0 bg-white"
              />
            </div>
          )}
          <section className="space-y-2">
            <h2 className="text-xl font-bold">Pulihkan Versi</h2>
            {doc.published && (
              <button
                type="button"
                disabled={busy}
                className="btn-secondary"
                onClick={() => save('restore', -1)}
              >
                Pulihkan media lama sebelum Kliping
              </button>
            )}
            {doc.history.length ? (
              doc.history.map((h, i) => (
                <button
                  key={`${h.at}-${i}`}
                  type="button"
                  disabled={busy}
                  className="block border bg-white p-3 text-sm"
                  onClick={() => save('restore', i)}
                >
                  Pulihkan versi {new Date(h.at).toLocaleString('id-ID')}
                </button>
              ))
            ) : (
              <p className="text-sm">Belum ada versi terbit sebelumnya.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
