'use client';
import RoutineLink from './RoutineLink';
import { useEffect, useState } from 'react';
import {
  emptyContent,
  sectionSuggestions,
  type PageContent,
} from '@/lib/design-schema';
import { contentSchema } from '@/lib/design-schema';
import useDraftAutosave from './useDraftAutosave';
import RichTextField from './RichTextField';
import ClippingManager from './ClippingManager';
type Document = {
  draft: PageContent | null;
  published: PageContent | null;
  history: { at: string; data: unknown }[];
  revision: number;
};
const field = 'mt-1 w-full min-w-0 border p-2';
export default function DesignManager({ kind, initialPath }: { kind: 'media' | 'content'; initialPath?: string }) {
  return kind === 'media' ? <ClippingManager initialPath={initialPath} /> : <ContentDesignManager initialPath={initialPath} />;
}
function ContentDesignManager({ initialPath = '/tentang/profil' }: { initialPath?: string }) {
  const kind = 'content';
  const [path, setPath] = useState(initialPath),
    [doc, setDoc] = useState<Document | null>(null),
    [data, setData] = useState<PageContent | null>(null),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [width, setWidth] = useState(375),
    [preview, setPreview] = useState(false);
  const [baseline, setBaseline] = useState('');
  const [failed, setFailed] = useState(false);
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
          setData(d.draft || d.published || emptyContent);
          setBaseline(JSON.stringify(d.draft || d.published || emptyContent));
          setFailed(false);
        }
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      });
    return () => {
      active = false;
    };
  }, [path, kind]);
  const [pages, setPages] = useState<{ path: string; title: string }[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  useEffect(() => {
    let active = true;
    fetch('/api/admin/design/pages', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json();
        if (active) {
          setPages(d.pages);
          setTitles(
            Object.fromEntries(
              d.pages.map((p: { path: string; title: string }) => [
                p.path,
                p.title,
              ]),
            ),
          );
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const content = data as PageContent | null;
  const updateContent = (patch: Partial<PageContent>) =>
    setData({ ...content!, ...patch });
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
      setData(d.draft || emptyContent);
      setBaseline(JSON.stringify(d.draft || emptyContent));
      setFailed(false);
      setMessage(
        action === 'draft'
          ? 'Draf tersimpan. Pengunjung tetap melihat versi terbit.'
          : 'Versi terbit diperbarui.',
      );
      setPreview(false);
    } catch (e) {
      setFailed(true);
      setMessage(e instanceof Error ? e.message : 'Gagal menyimpan');
    } finally {
      setBusy(false);
    }
  }
  useDraftAutosave(Boolean(data && JSON.stringify(data) !== baseline), busy || !doc || failed, contentSchema.safeParse(data).success, () => save('draft'));
  function sectionMove(index: number, direction: number) {
    const sections = [...content!.sections],
      to = index + direction;
    if (to < 0 || to >= sections.length) return;
    sections.splice(to, 0, sections.splice(index, 1)[0]);
    updateContent({ sections });
  }
  return (
    <div className="min-w-0 max-w-6xl space-y-5">
      <h1 className="text-3xl font-bold">Bagian Konten Resmi</h1>
      <RoutineLink />
      <p className="text-sm">
        Isi hanya informasi yang sudah disetujui. Bagian kosong atau
        dinonaktifkan tidak tampil. Setiap unit memiliki data sendiri.
      </p>
      <label className="block">
        Halaman
        <select
          value={path}
          className={field}
          disabled={busy}
          onChange={(e) => {
            if (data && JSON.stringify(data) !== baseline && !confirm('Ada perubahan belum tersimpan. Pindah halaman?')) return;
            setPath(e.target.value);
            setData(null);
            setDoc(null);
            setPreview(false);
            setMessage('');
          }}
        >
          {!pages.length && <option value={path}>Memuat halaman…</option>}
          {pages.map(({ path: p }) => (
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
      {content && (
        <fieldset disabled={busy} className="space-y-5">
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
        </fieldset>
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
                title="Pratinjau halaman publik: draf konten privat"
                src={`${path}?designPreview=1&designKind=${kind}`}
                style={{ width, maxWidth: 'none', height: 850 }}
                className="border-0 bg-white"
              />
            </div>
          )}
          <section className="space-y-2">
            <h2 className="text-xl font-bold">Pulihkan Versi</h2>
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
