'use client';
import { useEffect, useState } from 'react';
import {
  designPaths,
  emptyContent,
  sectionSuggestions,
  type Clip,
  type MediaDesign,
  type PageContent,
} from '@/lib/design-schema';
import RichTextField from './RichTextField';
import VisualGrid from '@/components/VisualMedia';
type Document = {
  draft: MediaDesign | PageContent | null;
  published: MediaDesign | PageContent | null;
  history: { at: string; data: unknown }[];
  revision: number;
};
const field = 'mt-1 w-full min-w-0 border p-2';
export default function DesignManager({ kind }: { kind: 'media' | 'content' }) {
  const [library, setLibrary] = useState<
    { label: string; type: 'image' | 'video'; url: string }[]
  >([]);
  useEffect(() => {
    Promise.all(
      ['/api/admin/media/galeri', '/api/admin/media/video'].map((url) =>
        fetch(url, { cache: 'no-store' }),
      ),
    )
      .then(async (responses) => {
        if (responses.some((r) => !r.ok))
          throw Error('Pustaka media gagal dimuat');
        const [g, v] = await Promise.all(responses.map((r) => r.json()));
        setLibrary([
          ...g.items
            .filter((a: { status: string }) => a.status === 'published')
            .flatMap((a: { title: string; images: { imageUrl: string }[] }) =>
              a.images.map((i, n) => ({
                label: `${a.title} / ${n + 1}`,
                type: 'image' as const,
                url: i.imageUrl,
              })),
            ),
          ...v.items
            .filter((a: { status: string }) => a.status === 'published')
            .map((a: { title: string; youtubeId: string }) => ({
              label: a.title,
              type: 'video' as const,
              url: `https://www.youtube.com/watch?v=${a.youtubeId}`,
            })),
        ]);
      })
      .catch(() => {});
  }, []);
  const [path, setPath] = useState('/tentang/profil'),
    [doc, setDoc] = useState<Document | null>(null),
    [data, setData] = useState<MediaDesign | PageContent | null>(null),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [width, setWidth] = useState(375),
    [preview, setPreview] = useState(false),
    [drag, setDrag] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    fetch(`/api/admin/design?path=${encodeURIComponent(path)}&kind=${kind}`, {
      cache: 'no-store',
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (active) {
          setDoc(d);
          setData(
            d.draft ||
              d.published ||
              (kind === 'media' ? { clips: [] } : emptyContent),
          );
        }
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      });
    return () => {
      active = false;
    };
  }, [path, kind]);
  const [sections, setSections] = useState<{ id: string; title: string }[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  useEffect(() => {
    let active = true;
    fetch('/api/admin/cms/pages', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json();
        if (active)
          setTitles(
            Object.fromEntries(
              d.pages.map((p: { path: string; title: string }) => [
                p.path,
                p.title,
              ]),
            ),
          );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    fetch(`/api/admin/design?path=${encodeURIComponent(path)}&kind=content`, {
      cache: 'no-store',
    })
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json();
        if (active) setSections((d.draft || d.published)?.sections || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [path]);
  const media = kind === 'media' ? (data as MediaDesign) : null,
    content = kind === 'content' ? (data as PageContent) : null;
  const updateContent = (patch: Partial<PageContent>) =>
    setData({ ...content!, ...patch });
  const updateClip = (index: number, patch: Partial<Clip>) =>
    setData({
      clips: media!.clips.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    });
  function move(from: number, to: number) {
    if (
      !media ||
      from < 0 ||
      from >= media.clips.length ||
      to < 0 ||
      to >= media.clips.length ||
      from === to
    )
      return;
    const clips = [...media.clips];
    clips.splice(to, 0, clips.splice(from, 1)[0]);
    setData({ clips });
  }
  async function save(
    action: 'draft' | 'publish' | 'restore',
    version?: number,
  ) {
    if (!doc || !data) return;
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch('/api/admin/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          kind,
          action,
          revision: doc.revision,
          data,
          version,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setDoc(d);
      setData(d.draft || (kind === 'media' ? { clips: [] } : emptyContent));
      setMessage(
        action === 'draft'
          ? 'Draf tersimpan. Pengunjung tetap melihat versi terbit.'
          : 'Versi terbit diperbarui.',
      );
      setPreview(false);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal menyimpan');
    } finally {
      setBusy(false);
    }
  }
  function sectionMove(index: number, direction: number) {
    const sections = [...content!.sections],
      to = index + direction;
    if (to < 0 || to >= sections.length) return;
    sections.splice(to, 0, sections.splice(index, 1)[0]);
    updateContent({ sections });
  }
  return (
    <div className="min-w-0 max-w-6xl space-y-5">
      <h1 className="text-3xl font-bold">
        {kind === 'media' ? 'Kliping Visual' : 'Bagian Konten Resmi'}
      </h1>
      <p className="text-sm">
        {kind === 'media'
          ? 'Hanya foto/video yang dapat diatur. Teks, tombol, Navbar dan Footer dikunci; gunakan formulir konten untuk mengubahnya.'
          : 'Isi hanya informasi yang sudah disetujui. Bagian kosong atau dinonaktifkan tidak tampil. Setiap unit memiliki data sendiri.'}
      </p>
      <label className="block">
        Halaman
        <select
          value={path}
          className={field}
          disabled={busy}
          onChange={(e) => {
            setPath(e.target.value);
            setData(null);
            setDoc(null);
            setPreview(false);
            setMessage('');
          }}
        >
          {designPaths.map((p) => (
            <option key={p} value={p}>
              {titles[p] || (p === '/' ? 'Beranda' : p)} — {p}
            </option>
          ))}
        </select>
      </label>
      {message && (
        <p role="status" className="border bg-white p-3">
          {message}
        </p>
      )}
      {media && (
        <>
          <p className="text-sm">
            MP4 HTTPS dapat autoplay di hero bila browser dan sumber mendukung.
            Drive tampil dengan poster/tombol Putar, tidak autoplay. Berkas
            harus dapat diakses publik. URL tidak diunduh ke server.
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              setData({
                clips: [
                  ...media.clips,
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
                    focalX: 50,
                    focalY: 50,
                  },
                ],
              })
            }
          >
            Tambah foto/video
          </button>
          <div className="grid gap-4 lg:grid-cols-2">
            {media.clips.map((c, i) => (
              <fieldset
                key={c.id}
                className="min-w-0 space-y-3 border bg-white p-4"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const source = media.clips.findIndex(
                    (clip) => clip.id === e.dataTransfer.getData('text/plain'),
                  );
                  if (source >= 0) move(source, i);
                  else if (drag !== null) move(drag, i);
                  setDrag(null);
                }}
              >
                <legend>Media {i + 1}</legend>
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', c.id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDrag(i);
                  }}
                  onDragEnd={() => setDrag(null)}
                  className="cursor-grab border px-3 py-2"
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
                    disabled={i === media.clips.length - 1}
                    className="btn-secondary"
                    onClick={() => move(i, i + 1)}
                  >
                    Turun
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      setData({ clips: media.clips.filter((_, n) => n !== i) })
                    }
                  >
                    Hapus
                  </button>
                </div>
                <label className="block">
                  Area
                  <select
                    className={field}
                    value={c.area}
                    onChange={(e) =>
                      updateClip(i, { area: e.target.value as Clip['area'] })
                    }
                  >
                    {[
                      'hero',
                      'inline',
                      'gallery',
                      ...(path === '/media'
                        ? ['card-kegiatan', 'card-video', 'card-galeri']
                        : []),
                    ].map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  Pustaka media terbit
                  <select
                    className={field}
                    value=""
                    onChange={(e) => {
                      const item = library[Number(e.target.value)];
                      if (item)
                        updateClip(i, {
                          url: item.url,
                          type: item.type,
                          alt: item.label,
                        });
                    }}
                  >
                    <option value="">Pilih dari galeri/video</option>
                    {library.map((item, n) => (
                      <option key={n} value={n}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  Jenis
                  <select
                    className={field}
                    value={c.type}
                    onChange={(e) =>
                      updateClip(i, { type: e.target.value as Clip['type'] })
                    }
                  >
                    <option value="image">Foto</option>
                    <option value="video">Video</option>
                  </select>
                </label>
                {(['url', 'alt', 'poster'] as const).map((key) => (
                  <label key={key} className="block">
                    {
                      {
                        url: 'URL media HTTPS',
                        alt: 'Teks alternatif / judul video',
                        poster: 'URL poster video',
                        afterSection:
                          'ID bagian teks (kosong = sebelum bagian)',
                      }[key]
                    }
                    <input
                      className={field}
                      value={c[key]}
                      onChange={(e) => updateClip(i, { [key]: e.target.value })}
                    />
                  </label>
                ))}
                {c.area === 'inline' && (
                  <label className="block">
                    Letakkan foto/video setelah bagian
                    <select
                      className={field}
                      value={c.afterSection}
                      onChange={(e) =>
                        updateClip(i, { afterSection: e.target.value })
                      }
                    >
                      <option value="">Sebelum bagian teks</option>
                      {sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title || 'Bagian tanpa judul'}
                        </option>
                      ))}
                      {c.afterSection &&
                        !sections.some((s) => s.id === c.afterSection) && (
                          <option value={c.afterSection}>
                            Bagian sebelumnya (tidak ditemukan)
                          </option>
                        )}
                    </select>
                  </label>
                )}
                <label className="block">
                  Ukuran
                  <select
                    className={field}
                    value={c.size}
                    onChange={(e) =>
                      updateClip(i, { size: e.target.value as Clip['size'] })
                    }
                  >
                    {['small', 'medium', 'wide'].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  Rasio crop
                  <select
                    className={field}
                    value={c.ratio}
                    onChange={(e) =>
                      updateClip(i, { ratio: e.target.value as Clip['ratio'] })
                    }
                  >
                    {['square', 'portrait', 'landscape', 'original'].map(
                      (v) => (
                        <option key={v}>{v}</option>
                      ),
                    )}
                  </select>
                </label>
                {(['focalX', 'focalY'] as const).map((key) => (
                  <label key={key} className="block">
                    Titik fokus {key === 'focalX' ? 'horizontal' : 'vertikal'}:{' '}
                    {c[key]}%
                    <input
                      type="range"
                      className="w-full"
                      min="0"
                      max="100"
                      value={c[key]}
                      onChange={(e) =>
                        updateClip(i, { [key]: Number(e.target.value) })
                      }
                    />
                  </label>
                ))}
                <VisualGrid clips={[c]} />
              </fieldset>
            ))}
          </div>
        </>
      )}
      {content && (
        <>
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              updateContent({
                sections: [
                  ...content.sections,
                  {
                    id: crypto.randomUUID(),
                    title: '',
                    body: '',
                    enabled: false,
                    icon: 'none',
                  },
                ],
              })
            }
          >
            Tambah bagian teks
          </button>
          <div className="flex flex-wrap gap-2">
            {sectionSuggestions(path).map((title) => (
              <button
                type="button"
                key={title}
                className="border bg-white p-2 text-sm"
                onClick={() =>
                  updateContent({
                    sections: [
                      ...content.sections,
                      {
                        id: crypto.randomUUID(),
                        title,
                        body: '',
                        enabled: false,
                        icon: 'none',
                      },
                    ],
                  })
                }
              >
                + {title}
              </button>
            ))}
          </div>
          {content.sections.map((s, i) => (
            <section className="space-y-3 border bg-white p-4" key={s.id}>
              <p className="break-all text-xs">
                ID bagian untuk kliping: {s.id}
              </p>
              <label className="block">
                Judul bagian
                <input
                  className={field}
                  value={s.title}
                  onChange={(e) =>
                    updateContent({
                      sections: content.sections.map((v, n) =>
                        n === i ? { ...v, title: e.target.value } : v,
                      ),
                    })
                  }
                />
              </label>
              <RichTextField
                label={`Isi ${s.title || 'bagian'}`}
                value={s.body}
                onChange={(body) =>
                  updateContent({
                    sections: content.sections.map((v, n) =>
                      n === i ? { ...v, body } : v,
                    ),
                  })
                }
              />
              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={(e) =>
                    updateContent({
                      sections: content.sections.map((v, n) =>
                        n === i ? { ...v, enabled: e.target.checked } : v,
                      ),
                    })
                  }
                />
                Tampilkan bagian
              </label>
              <label className="block">
                Ikon
                <select
                  className={field}
                  value={s.icon}
                  onChange={(e) =>
                    updateContent({
                      sections: content.sections.map((v, n) =>
                        n === i
                          ? { ...v, icon: e.target.value as typeof s.icon }
                          : v,
                      ),
                    })
                  }
                >
                  {['none', 'book', 'people', 'location', 'award'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={!i}
                  onClick={() => sectionMove(i, -1)}
                >
                  Naik
                </button>
                <button
                  type="button"
                  disabled={i === content.sections.length - 1}
                  onClick={() => sectionMove(i, 1)}
                >
                  Turun
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateContent({
                      sections: content.sections.filter((_, n) => n !== i),
                    })
                  }
                >
                  Hapus
                </button>
              </div>
            </section>
          ))}
          {['/tentang/kontak', '/tentang/profil'].includes(path) && (
            <section className="space-y-3 border bg-white p-4">
              {(
                ['address', 'mapsUrl', 'mapEmbed', 'serviceHours'] as const
              ).map((key) => (
                <label className="block" key={key}>
                  {
                    {
                      address: 'Alamat lengkap',
                      mapsUrl: 'Tautan Buka di Maps',
                      mapEmbed: 'URL embed Google Maps resmi (opsional)',
                      serviceHours: 'Jam layanan',
                    }[key]
                  }
                  <textarea
                    className={field}
                    value={content[key]}
                    onChange={(e) => updateContent({ [key]: e.target.value })}
                  />
                </label>
              ))}
              {path === '/tentang/kontak' && (
                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={content.contactFormEnabled}
                    onChange={(e) =>
                      updateContent({ contactFormEnabled: e.target.checked })
                    }
                  />
                  Aktifkan formulir Hubungi Kami (pesan tersimpan di Admin)
                </label>
              )}
            </section>
          )}
          {path === '/' && (
            <section className="space-y-3 border bg-white p-4">
              {(['showWorks', 'showEducation'] as const).map((key) => (
                <label key={key} className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={content[key]}
                    onChange={(e) => updateContent({ [key]: e.target.checked })}
                  />
                  {key === 'showWorks'
                    ? 'Tampilkan Karya-karya Terbaru'
                    : 'Tampilkan Pendidikan Mahida'}
                </label>
              ))}
            </section>
          )}
          {path === '/media/video' && (
            <label className="block">
              ID video sorotan terbit (lihat modul Video)
              <input
                type="number"
                className={field}
                min="1"
                value={content.featuredVideoId || ''}
                onChange={(e) =>
                  updateContent({
                    featuredVideoId: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              />
            </label>
          )}
          {path === '/tentang/pendaftaran' && (
            <section className="space-y-4 border bg-white p-4">
              <label className="block">
                PDF brosur resmi
                <input
                  className={field}
                  value={content.brochureUrl}
                  onChange={(e) =>
                    updateContent({ brochureUrl: e.target.value })
                  }
                />
              </label>
              <RichTextField
                label="Rincian biaya resmi"
                value={content.fees}
                onChange={(fees) => updateContent({ fees })}
              />
              <h2 className="text-xl font-bold">FAQ</h2>
              {content.faq.map((f, i) => (
                <div key={i}>
                  <label className="block">
                    Pertanyaan
                    <input
                      className={field}
                      value={f.question}
                      onChange={(e) =>
                        updateContent({
                          faq: content.faq.map((x, n) =>
                            n === i ? { ...x, question: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="block">
                    Jawaban
                    <textarea
                      className={field}
                      value={f.answer}
                      onChange={(e) =>
                        updateContent({
                          faq: content.faq.map((x, n) =>
                            n === i ? { ...x, answer: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      updateContent({
                        faq: content.faq.filter((_, n) => n !== i),
                      })
                    }
                  >
                    Hapus FAQ
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  updateContent({
                    faq: [...content.faq, { question: '', answer: '' }],
                  })
                }
              >
                Tambah FAQ
              </button>
              <h2 className="text-xl font-bold">Testimoni berizin</h2>
              {content.testimonials.map((t, i) => (
                <div key={i}>
                  <label className="block">
                    Identitas
                    <input
                      className={field}
                      value={t.name}
                      onChange={(e) =>
                        updateContent({
                          testimonials: content.testimonials.map((x, n) =>
                            n === i ? { ...x, name: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="block">
                    Testimoni
                    <textarea
                      className={field}
                      value={t.text}
                      onChange={(e) =>
                        updateContent({
                          testimonials: content.testimonials.map((x, n) =>
                            n === i ? { ...x, text: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      updateContent({
                        testimonials: content.testimonials.filter(
                          (_, n) => n !== i,
                        ),
                      })
                    }
                  >
                    Hapus testimoni
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      'Teks dan identitas sudah disetujui untuk ditayangkan?',
                    )
                  )
                    updateContent({
                      testimonials: [
                        ...content.testimonials,
                        { name: '', text: '', permission: true },
                      ],
                    });
                }}
              >
                Tambah testimoni berizin
              </button>
            </section>
          )}
        </>
      )}
      {data && (
        <>
          <div className="flex flex-wrap gap-3">
            <button
              className="btn-secondary"
              disabled={busy}
              onClick={() => save('draft')}
            >
              Simpan Draf
            </button>
            <button
              className="btn-secondary"
              disabled={busy}
              onClick={() => setPreview(!preview)}
            >
              Pratinjau Draf tersimpan
            </button>
            <button
              className="btn-primary"
              disabled={busy}
              onClick={() => save('publish')}
            >
              Terbitkan
            </button>
          </div>
          <p className="text-sm">
            Pratinjau menampilkan draf yang sudah disimpan. Perubahan formulir
            perlu disimpan terlebih dahulu.
          </p>
          <div className="flex gap-2">
            {[
              [375, 'HP'],
              [768, 'Tablet'],
              [1440, 'PC'],
            ].map(([w, label]) => (
              <button
                key={w}
                type="button"
                aria-pressed={width === w}
                className="border bg-white p-3"
                onClick={() => setWidth(Number(w))}
              >
                {label}
              </button>
            ))}
          </div>
          {preview && (
            <div className="max-w-full overflow-x-auto border">
              <iframe
                key={`${path}-${doc?.revision}`}
                title="Pratinjau halaman publik: hanya area media dapat diubah melalui formulir"
                src={`${path}?designPreview=1`}
                style={{ width, maxWidth: 'none', height: 850 }}
                className="border-0 bg-white"
              />
            </div>
          )}
          <section className="space-y-2">
            <h2 className="text-xl font-bold">Pulihkan Versi</h2>
            {kind === 'media' && doc?.published && (
              <button
                type="button"
                className="btn-secondary"
                disabled={busy}
                onClick={() => save('restore', -1)}
              >
                Pulihkan media lama sebelum Kliping
              </button>
            )}
            {doc?.history.length ? (
              doc.history.map((h, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={busy}
                  className="block border bg-white p-3"
                  onClick={() => save('restore', i)}
                >
                  Pulihkan versi {new Date(h.at).toLocaleString('id-ID')}
                </button>
              ))
            ) : (
              <p>Belum ada versi terbit sebelumnya.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
