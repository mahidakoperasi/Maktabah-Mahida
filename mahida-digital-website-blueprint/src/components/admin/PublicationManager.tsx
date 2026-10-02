'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { publicationSchema, type Publication } from '@/lib/publication-schema';
import RichTextField from './RichTextField';
import ImageUrlPreview from './ImageUrlPreview';
import useDraftAutosave from './useDraftAutosave';
type Target = { target: string; title: string; url: string };
type Document = {
  draft: Publication;
  revision: number;
  source: string;
  status: string;
  publicPath: string;
  scheduled_at: string | null;
  scheduled_error?: string;
  history: { at: string; by: number; status: string; data: Publication }[];
};
const field = 'mt-1 w-full min-w-0 border bg-white p-3';
export default function PublicationManager() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [target, setTarget] = useState('');
  const [doc, setDoc] = useState<Document | null>(null);
  const [data, setData] = useState<Publication | null>(null);
  const [baseline, setBaseline] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState(false);
  const [width, setWidth] = useState(375);
  const [when, setWhen] = useState('');
  const dirty = Boolean(data && JSON.stringify(data) !== baseline);
  useEffect(() => {
    let active = true;
    fetch('/api/admin/publication', { cache: 'no-store' })
      .then(async (r) => {
        const result = await r.json();
        if (!r.ok) throw Error(result.error);
        if (active) {
          setTargets(result.items);
          const requested = new URLSearchParams(window.location.search).get('target');
          setTarget(
            result.items.find((p: Target) => p.target === requested)?.target ??
              result.items[0]?.target ??
              '',
          );
          if (!result.items.length) setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  function accept(next: Document) {
    setDoc(next);
    setData(next.draft);
    setBaseline(JSON.stringify(next.draft));
  }
  useEffect(() => {
    if (!target) return;
    let active = true;
    fetch(`/api/admin/publication?target=${encodeURIComponent(target)}`, {
      cache: 'no-store',
    })
      .then(async (r) => {
        const result = await r.json();
        if (!r.ok) throw Error(result.error);
        if (active) accept(result);
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
  }, [target]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  async function save(
    action: 'draft' | 'publish' | 'schedule' | 'cancel',
    openPreview = false,
  ) {
    if (!doc || !data || busy) return;
    if (action === 'publish' && !confirm('Terbitkan teks dan media terkait bersama?'))
      return;
    if (
      action === 'schedule' &&
      (!when ||
        !confirm(
          'Jadwalkan versi ini? Perubahan draf sesudahnya tidak mengubah versi yang dijadwalkan.',
        ))
    )
      return;
    setBusy(true);
    setError('');
    try {
      const scheduledAt =
        action === 'schedule' ? new Date(`${when}:00+07:00`).toISOString() : undefined;
      const r = await fetch('/api/admin/publication', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          revision: doc.revision,
          source: doc.source,
          action,
          data,
          scheduledAt,
        }),
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error);
      accept(result);
      setPreview(openPreview);
      setNotice(
        action === 'draft'
          ? 'Draf tersimpan otomatis. Pengunjung tetap melihat versi terbit.'
          : action === 'schedule'
            ? 'Versi dijadwalkan. Draf berikutnya tetap terpisah.'
            : action === 'cancel'
              ? 'Jadwal dibatalkan. Terbitan dan draf tetap tersimpan.'
              : 'Teks dan media diterbitkan bersama.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan');
    } finally {
      setBusy(false);
    }
  }
  useDraftAutosave(
    dirty,
    busy || loading || Boolean(error),
    publicationSchema.safeParse(data).success,
    () => save('draft'),
  );
  async function reload() {
    if (
      dirty &&
      !confirm(
        'Muat versi terbaru? Perubahan lokal yang belum tersimpan akan ditinggalkan.',
      )
    )
      return;
    setBusy(true);
    try {
      const r = await fetch(
        `/api/admin/publication?target=${encodeURIComponent(target)}`,
        { cache: 'no-store' },
      );
      const result = await r.json();
      if (!r.ok) throw Error(result.error);
      accept(result);
      setError('');
      setPreview(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-w-0 max-w-6xl space-y-5">
      <h1 className="text-3xl font-bold">Header & Penerbitan</h1>
      <p className="text-sm">
        Tinjau teks dan media pada satu halaman lengkap, simpan sebagai draf, lalu
        terbitkan bersama. Menu aktif mengikuti Halaman & Menu.
      </p>
      {error && (
        <p
          role="alert"
          className="border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}{' '}
          <button type="button" disabled={busy} className="underline" onClick={reload}>
            Muat versi terbaru
          </button>
        </p>
      )}
      {notice && (
        <p role="status" className="border bg-white p-3 text-sm">
          {notice}
        </p>
      )}
      <label className="block text-sm">
        Halaman atau publikasi
        <select
          aria-label="Target penerbitan"
          disabled={busy || loading}
          value={target}
          className={field}
          onChange={(e) => {
            if (dirty && !confirm('Ada perubahan belum tersimpan. Pindah publikasi?'))
              return;
            setTarget(e.target.value);
            setDoc(null);
            setData(null);
            setLoading(true);
            setError('');
            setNotice('');
            setPreview(false);
          }}
        >
          {targets.map((p) => (
            <option key={p.target} value={p.target}>
              {p.title} — {p.target}
            </option>
          ))}
        </select>
      </label>
      {loading && <p>Memuat draf…</p>}
      {data && doc && (
        <fieldset
          disabled={busy || loading}
          className="min-w-0 space-y-5 disabled:opacity-70"
        >
          <p className="text-sm" data-autosave-status>
            {busy ? 'Menyimpan…' : dirty ? 'Menunggu simpan otomatis…' : 'Draf tersimpan'}{' '}
            • Terbitan: {doc.status}
          </p>
          {data.type === 'page' && (
            <>
              <label className="block text-sm">
                URL Drive logo header
                <input
                  className={field}
                  value={data.media?.headerLogoUrl ?? ''}
                  onChange={(e) =>
                    setData({
                      ...data,
                      media: {
                        ...(data.media ?? { clips: [], useLegacyMedia: true }),
                        headerLogoUrl: e.target.value,
                      },
                    })
                  }
                />
              </label>
              <p className="text-xs">
                Kosongkan untuk menyembunyikan header logo. Logo tampil di atas
                isi/sidebar dan ikut hilang saat halaman digulir.
              </p>
              <ImageUrlPreview url={data.media?.headerLogoUrl ?? ''} />
              {data.path === '/' ? (
                <Link className="text-sm underline" href="/admin/tampilan/beranda">
                  Atur teks dan tombol Beranda
                </Link>
              ) : (
                <>
                  <label className="block text-sm">
                    Judul halaman
                    <input
                      maxLength={255}
                      className={field}
                      value={data.title}
                      onChange={(e) => setData({ ...data, title: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm">
                    Pengantar
                    <textarea
                      maxLength={2000}
                      className={field}
                      value={data.intro}
                      onChange={(e) => setData({ ...data, intro: e.target.value })}
                    />
                  </label>
                  <RichTextField
                    label="Teks utama halaman"
                    value={data.body}
                    onChange={(body) => setData({ ...data, body })}
                  />
                </>
              )}
              {data.content?.sections.map((section, i) => (
                <section key={section.id} className="space-y-3 border bg-white p-4">
                  <label className="block text-sm">
                    Judul bagian
                    <input
                      className={field}
                      value={section.title}
                      onChange={(e) =>
                        setData({
                          ...data,
                          content: {
                            ...data.content!,
                            sections: data.content!.sections.map((s, n) =>
                              n === i ? { ...s, title: e.target.value } : s,
                            ),
                          },
                        })
                      }
                    />
                  </label>
                  <RichTextField
                    label={`Isi ${section.title || 'bagian'}`}
                    value={section.body}
                    onChange={(body) =>
                      setData({
                        ...data,
                        content: {
                          ...data.content!,
                          sections: data.content!.sections.map((s, n) =>
                            n === i ? { ...s, body } : s,
                          ),
                        },
                      })
                    }
                  />
                  <label className="text-sm">
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={(e) =>
                        setData({
                          ...data,
                          content: {
                            ...data.content!,
                            sections: data.content!.sections.map((s, n) =>
                              n === i ? { ...s, enabled: e.target.checked } : s,
                            ),
                          },
                        })
                      }
                    />{' '}
                    Tampilkan bagian
                  </label>
                </section>
              ))}
              <p className="text-sm">
                {data.media?.clips.length ?? 0} foto/video terkait.{' '}
                <Link
                  className="underline"
                  href={`/admin/tampilan/kliping?path=${encodeURIComponent(data.path)}`}
                >
                  Atur kliping
                </Link>{' '}
                •{' '}
                <Link
                  className="underline"
                  href={`/admin/tampilan/bagian?path=${encodeURIComponent(data.path)}`}
                >
                  Tambah/atur bagian resmi
                </Link>
              </p>
              <button type="button" className="btn-secondary" onClick={reload}>
                Muat teks/media terkait terbaru
              </button>
            </>
          )}
          {data.type === 'gallery' && (
            <>
              <h2 className="text-xl font-bold">{data.data.title}</h2>
              <p className="text-sm">
                Teks, keterangan dan{' '}
                {data.data.photos.filter((p) => p.selected && p.visible).length} foto
                tampil akan diterbitkan sebagai satu album.
              </p>
              <Link href="/admin/media/galeri" className="underline">
                Atur foto dan keterangan di Galeri Foto
              </Link>
              <button type="button" className="btn-secondary" onClick={reload}>
                Muat kurasi terbaru
              </button>
            </>
          )}
          {data.type === 'announcement' && (
            <>
              <label className="block text-sm">
                Judul pengumuman
                <input
                  className={field}
                  value={data.title}
                  onChange={(e) => setData({ ...data, title: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Ringkasan
                <textarea
                  className={field}
                  value={data.excerpt}
                  onChange={(e) => setData({ ...data, excerpt: e.target.value })}
                />
              </label>
              <RichTextField
                label="Isi pengumuman"
                value={data.content}
                onChange={(content) => setData({ ...data, content })}
              />
              <label className="block text-sm">
                URL foto Drive
                <input
                  className={field}
                  value={data.featuredImage}
                  onChange={(e) => setData({ ...data, featuredImage: e.target.value })}
                />
              </label>
              <ImageUrlPreview url={data.featuredImage} />
            </>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-secondary" onClick={() => save('draft')}>
              Simpan Draf
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => save('draft', true)}
            >
              Pratinjau halaman lengkap
            </button>
            <button type="button" className="btn-primary" onClick={() => save('publish')}>
              Terbitkan teks & media
            </button>
            <Link
              target="_blank"
              href={doc.publicPath}
              className="self-center text-sm underline"
            >
              Lihat publik
            </Link>
          </div>
          {data.type !== 'page' && (
            <section className="space-y-3 border bg-white p-4">
              <label className="block text-sm">
                Jadwal tampil (WIB / Asia Jakarta)
                <input
                  aria-label="Jadwal tampil WIB"
                  type="datetime-local"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                  className={field}
                />
              </label>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => save('schedule')}
              >
                Jadwalkan versi ini
              </button>
            </section>
          )}
          {doc.scheduled_at && (
            <p className="border bg-amber-50 p-3 text-sm">
              Dijadwalkan:{' '}
              {new Date(doc.scheduled_at).toLocaleString('id-ID', {
                timeZone: 'Asia/Jakarta',
              })}{' '}
              WIB.{' '}
              <button type="button" className="underline" onClick={() => save('cancel')}>
                Batalkan jadwal
              </button>
            </p>
          )}
          {doc.scheduled_error && (
            <p role="alert" className="bg-red-50 p-3 text-sm text-red-700">
              {doc.scheduled_error} Periksa sumber lalu jadwalkan kembali.
            </p>
          )}
          {preview && (
            <section className="min-w-0 space-y-3">
              <p className="text-sm">Pratinjau privat draf tersimpan.</p>
              <div className="flex gap-2">
                {[375, 768, 1440].map((w) => (
                  <button
                    key={w}
                    type="button"
                    className="btn-secondary"
                    onClick={() => setWidth(w)}
                  >
                    {w === 375 ? 'HP' : w === 768 ? 'Tablet' : 'PC'}
                  </button>
                ))}
              </div>
              <div className="max-w-full overflow-x-auto border">
                <iframe
                  title="Pratinjau penerbitan lengkap"
                  src={`${doc.publicPath}?publicationPreview=${encodeURIComponent(target)}&revision=${doc.revision}`}
                  style={{ width, height: 800, maxWidth: 'none' }}
                  className="block bg-white"
                />
              </div>
            </section>
          )}
          {!!doc.history.length && (
            <details className="border bg-white p-4">
              <summary>Riwayat versi & pemulihan (20 terakhir)</summary>
              <div className="mt-3 space-y-3">
                {doc.history.map((version, i) => (
                  <div
                    key={`${version.at}-${i}`}
                    className="flex flex-wrap gap-3 border-b py-2 text-sm"
                  >
                    <span>
                      {new Date(version.at).toLocaleString('id-ID', {
                        timeZone: 'Asia/Jakarta',
                      })}{' '}
                      WIB • Admin #{version.by} • {version.status}
                    </span>
                    <button
                      type="button"
                      className="underline"
                      onClick={() => {
                        if (
                          confirm(
                            'Pulihkan teks dan media versi ini ke draf? Publik tetap melihat terbitan saat ini.',
                          )
                        ) {
                          setData(version.data);
                          setPreview(false);
                          setNotice(
                            'Versi dipulihkan ke draf. Tinjau sebelum menerbitkan kembali.',
                          );
                        }
                      }}
                    >
                      Pulihkan ke draf
                    </button>
                  </div>
                ))}
              </div>
            </details>
          )}
        </fieldset>
      )}
    </div>
  );
}
