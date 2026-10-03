'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { QualityReport } from '@/lib/quality-schema';
import { exportKinds, type ExportKind } from '@/lib/export-data';
import { analyticsLabels, type AnalyticsEvent } from '@/lib/analytics-schema';
import { adminGuideSections } from '@/lib/admin-guide';
import QualityReportView from './QualityReportView';
type Target = { target: string; title: string; url: string };
type Stats = {
  enabled: boolean;
  days: number;
  events: { event: AnalyticsEvent; count: number }[];
  pages: { path: string; count: number }[];
  daily: { day: string; event: AnalyticsEvent; count: number }[];
  clicks: { path: string; event: AnalyticsEvent; count: number }[];
  promotion: {
    id: string;
    name: string;
    title: string;
    statisticsEnabled: boolean;
    enabled: boolean;
    startsAt: string | null;
    endsAt: string | null;
    counts: { view: number; close: number; click: number };
  } | null;
};
const field = 'mt-1 w-full min-w-0 border bg-white p-3';
export default function RoutineManager() {
  const [tab, setTab] = useState('Pemeriksaan'),
    [targets, setTargets] = useState<Target[]>([]),
    [caps, setCaps] = useState<Record<string, boolean>>({});
  const [target, setTarget] = useState(''),
    [version, setVersion] = useState<'draft' | 'published'>('published');
  const [report, setReport] = useState<QualityReport | null>(null),
    [stale, setStale] = useState(false),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const [kind, setKind] = useState<ExportKind | ' '>(' '),
    [format, setFormat] = useState('json'),
    [offset, setOffset] = useState(0),
    [nextOffset, setNextOffset] = useState<number | null>(null),
    [exportNote, setExportNote] = useState('');
  const [stats, setStats] = useState<Stats | null>(null),
    [days, setDays] = useState(30);
  useEffect(() => {
    let active = true;
    fetch('/api/admin/quality', { cache: 'no-store' })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw Error(data.error);
        if (!active) return;
        setTargets(data.items);
        setCaps(data.capabilities);
        if (
          data.capabilities.primary &&
          new URLSearchParams(window.location.search).get('tab') === 'statistik'
        )
          setTab('Statistik');
        const requested = new URLSearchParams(window.location.search).get(
          'target',
        );
        setTarget(
          data.items.find((t: Target) => t.target === requested)?.target ??
            data.items[0]?.target ??
            '',
        );
        if (requested) setVersion('draft');
        const first = Object.entries(exportKinds).find(
          ([, v]) => data.capabilities[v.scope],
        );
        if (first) setKind(first[0] as ExportKind);
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
  }, []);
  useEffect(() => {
    if (!target) return;
    let active = true;
    fetch(
      `/api/admin/quality?target=${encodeURIComponent(target)}&version=${version}`,
      { cache: 'no-store' },
    )
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw Error(data.error);
        if (active) {
          setReport(data.report);
          setStale(data.stale);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [target, version]);
  useEffect(() => {
    if (tab !== 'Statistik' || !caps.primary) return;
    let active = true;
    fetch(`/api/admin/analytics?days=${days}`, { cache: 'no-store' })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw Error(data.error);
        if (active) setStats(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [tab, caps.primary, days]);
  async function check() {
    if (!target || busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/admin/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, version }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      setReport(data.report);
      setStale(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pemeriksaan gagal');
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    if (kind === ' ' || busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(
        `/api/admin/exports?kind=${kind}&format=${format}&offset=${offset}`,
        { cache: 'no-store' },
      );
      if (!response.ok) {
        const data = await response.json();
        throw Error(data.error);
      }
      const blob = await response.blob(),
        url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download =
        /filename="([^"]+)"/.exec(
          response.headers.get('Content-Disposition') ?? '',
        )?.[1] ?? `mahida-${kind}.${format}`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      const next = response.headers.get('X-Export-Next-Offset');
      setNextOffset(next ? Number(next) : null);
      setExportNote(
        next
          ? 'Bagian ini diunduh. Masih ada bagian berikutnya.'
          : 'Bagian ini diunduh. Ekspor sudah mencapai data terakhir.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ekspor gagal');
    } finally {
      setBusy(false);
    }
  }
  async function toggleAnalytics() {
    if (!stats || busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/admin/analytics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !stats.enabled }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      setStats({ ...stats, enabled: data.enabled });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengubah statistik');
    } finally {
      setBusy(false);
    }
  }
  const selected = targets.find((t) => t.target === target);
  const publication = /^(page|gallery|announcement):/.test(target);
  return (
    <div className="min-w-0 max-w-6xl space-y-5">
      <h1 className="text-3xl font-bold">Pengelolaan Harian</h1>
      <p className="text-sm">
        Periksa kualitas isi, unduh data sesuai hak akses, dan ikuti panduan
        sebelum menerbitkan.
      </p>
      <nav aria-label="Pengelolaan harian" className="flex flex-wrap gap-2">
        {[
          'Pemeriksaan',
          'Ekspor',
          ...(caps.primary ? ['Statistik'] : []),
          'Panduan Admin',
        ].map((t) => (
          <button
            key={t}
            disabled={busy}
            type="button"
            aria-pressed={tab === t}
            className={tab === t ? 'btn-primary' : 'btn-secondary'}
            onClick={() => {
              setTab(t);
              setError('');
            }}
          >
            {t}
          </button>
        ))}
      </nav>
      {error && (
        <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm">
          {error}
        </p>
      )}
      {loading && <p>Memuat kewenangan…</p>}
      {tab === 'Pemeriksaan' && (
        <section className="space-y-4">
          <label className="block text-sm">
            Target pemeriksaan
            <select
              aria-label="Target pemeriksaan"
              disabled={busy || loading}
              className={field}
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                setReport(null);
                setStale(false);
                setError('');
              }}
            >
              {targets.map((t) => (
                <option key={t.target} value={t.target}>
                  {t.title} — {t.target}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Versi yang diperiksa
            <select
              disabled={busy}
              className={field}
              value={version}
              onChange={(e) => {
                setVersion(e.target.value as typeof version);
                setReport(null);
                setStale(false);
              }}
            >
              <option value="published">
                Versi terbit (yang dilihat pengunjung)
              </option>
              <option value="draft">Draf terbaru</option>
            </select>
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              disabled={busy || !target}
              type="button"
              className="btn-primary"
              onClick={check}
            >
              {busy ? 'Memeriksa…' : 'Jalankan pemeriksaan'}
            </button>
            {selected?.url && (
              <Link
                href={selected.url}
                target="_blank"
                className="self-center text-sm underline"
              >
                Buka halaman publik
              </Link>
            )}
            {publication && (
              <Link
                className="self-center text-sm underline"
                href={`/admin/tampilan/penerbitan?target=${encodeURIComponent(target)}`}
              >
                Pratinjau & checklist penerbitan
              </Link>
            )}
          </div>
          <p className="text-xs">
            Pemeriksaan tidak mengubah isi atau menghapus media. Laporan
            terakhir menyimpan waktu dan versi; ulangi setelah perubahan.
            Maksimal 100 tautan/media per pemeriksaan.
          </p>
          {report ? (
            <QualityReportView report={report} stale={stale} />
          ) : (
            <p className="border bg-white p-4 text-sm">
              Belum ada laporan untuk versi ini. Jalankan pemeriksaan.
            </p>
          )}
          <p className="text-sm">
            Checklist sebelum terbit: status halaman, foto/video dan alt,
            tombol, tampilan HP, serta informasi pribadi. Buka Panduan Admin
            untuk langkah lengkap.
          </p>
        </section>
      )}
      {tab === 'Ekspor' && (
        <section className="space-y-4 border bg-white p-4">
          <h2 className="text-xl font-bold">Ekspor data</h2>
          <label className="block text-sm">
            Jenis data
            <select
              disabled={busy}
              className={field}
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as ExportKind);
                setOffset(0);
                setNextOffset(null);
                setExportNote('');
              }}
            >
              {Object.entries(exportKinds)
                .filter(([, v]) => caps[v.scope])
                .map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
            </select>
          </label>
          <label className="block text-sm">
            Format ekspor
            <select
              disabled={busy}
              className={field}
              value={format}
              onChange={(e) => {
                setFormat(e.target.value);
                setOffset(0);
                setNextOffset(null);
                setExportNote('');
              }}
            >
              <option value="json">JSON — struktur lengkap</option>
              <option value="csv">CSV — dibuka di spreadsheet</option>
            </select>
          </label>
          <p className="text-sm">
            Mulai data ke-{offset + 1}; maksimal 50 data / 8 MB per bagian. JSON
            mempertahankan struktur foto/draf. Ekspor bukan backup untuk restore
            database.
          </p>
          {['forms', 'orders'].includes(kind) && (
            <p className="border border-amber-300 bg-amber-50 p-3 text-sm">
              Ekspor ini berisi data pribadi. Simpan dan gunakan sesuai tujuan
              pengelolaan.
            </p>
          )}
          {kind === 'admissions' && (
            <p className="text-sm">
              Jawaban formulir pendaftaran eksternal tidak tersimpan di Mahida.
              Unduh jawaban dari layanan formulir; di sini hanya
              pengaturan/tautannya.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy || kind === ' '}
              className="btn-primary"
              onClick={download}
            >
              {busy ? 'Menyiapkan…' : 'Unduh bagian ini'}
            </button>
            {nextOffset !== null && (
              <button
                type="button"
                disabled={busy}
                className="btn-secondary"
                onClick={() => {
                  setOffset(nextOffset);
                  setNextOffset(null);
                  setExportNote('Siap mengunduh bagian berikutnya.');
                }}
              >
                Bagian berikutnya
              </button>
            )}
            {offset > 0 && (
              <button
                type="button"
                disabled={busy}
                className="btn-secondary"
                onClick={() => {
                  setOffset(0);
                  setNextOffset(null);
                  setExportNote('');
                }}
              >
                Kembali ke awal
              </button>
            )}
          </div>
          {exportNote && (
            <p role="status" className="text-sm">
              {exportNote}
            </p>
          )}
        </section>
      )}
      {tab === 'Statistik' && caps.primary && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Statistik anonim Mahida</h2>
          <p className="text-sm">
            Kunjungan halaman dan klik, bukan orang unik atau transaksi
            berhasil. Data mulai dikumpulkan setelah Rilis 5, memakai hari WIB
            dan retensi 180 hari. Admin, pratinjau, Do Not Track dan bot yang
            dikenali tidak dihitung.
          </p>
          <label className="block text-sm">
            Periode statistik
            <select
              className={field}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              {[7, 30, 90].map((d) => (
                <option key={d} value={d}>
                  {d} hari terakhir
                </option>
              ))}
            </select>
          </label>
          {stats ? (
            <>
              <p className="text-sm">
                Pencatatan:{' '}
                <strong>{stats.enabled ? 'aktif' : 'nonaktif'}</strong>{' '}
                (kunjungan dan klik website)
              </p>
              <button
                disabled={busy}
                type="button"
                className="btn-secondary"
                onClick={toggleAnalytics}
              >
                {stats.enabled
                  ? 'Nonaktifkan pencatatan'
                  : 'Aktifkan pencatatan'}
              </button>
              <section
                aria-label="Statistik promosi"
                className="space-y-3 border border-mahida-200 bg-white p-4"
              >
                <h3 className="font-bold">Statistik promosi</h3>
                {stats.promotion ? (
                  <>
                    <p className="text-sm">{stats.promotion.name}</p>
                    <p className="text-xs text-warm-gray-600">
                      Pencatatan promosi:{' '}
                      {stats.promotion.statisticsEnabled ? 'aktif' : 'nonaktif'}
                      . Angka mengikuti periode {stats.days} hari yang dipilih,
                      termasuk saat kampanye dijeda atau selesai.
                    </p>
                    <dl className="grid grid-cols-3 gap-3">
                      {(
                        [
                          ['view', 'Tampil'],
                          ['close', 'Ditutup'],
                          ['click', 'Klik tombol'],
                        ] as const
                      ).map(([key, label]) => (
                        <div key={key} className="rounded bg-mahida-50 p-3">
                          <dt className="text-xs">{label}</dt>
                          <dd className="mt-1 text-xl font-semibold">
                            {stats.promotion!.counts[key].toLocaleString(
                              'id-ID',
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="text-xs text-warm-gray-600">
                      Hitungan kampanye terbit saat ini; bukan pengunjung unik.
                      Kampanye baru memiliki hitungan tersendiri. Pengaturan
                      pencatatan promosi terpisah dari kunjungan website.
                    </p>
                  </>
                ) : (
                  <p className="text-sm">Belum ada promosi terbit.</p>
                )}
                <Link
                  className="inline-block text-sm text-emerald-forest underline"
                  href="/admin/tampilan/promosi"
                >
                  Kelola promosi dan pencatatannya
                </Link>
              </section>
              <div className="grid gap-3 sm:grid-cols-2">
                {stats.events.map((e) => (
                  <div key={e.event} className="border bg-white p-4">
                    <p className="text-sm">
                      {analyticsLabels[e.event] ?? e.event}
                    </p>
                    <strong className="text-2xl">
                      {e.count.toLocaleString('id-ID')}
                    </strong>
                  </div>
                ))}
              </div>
              {!stats.events.length && (
                <p className="border bg-white p-4">
                  Belum ada kunjungan atau klik tercatat pada periode ini.
                </p>
              )}
              <h3 className="font-bold">Halaman paling sering dikunjungi</h3>
              <div className="overflow-x-auto border bg-white">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th className="p-3">Halaman</th>
                      <th className="p-3">Kunjungan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.pages.map((p) => (
                      <tr key={p.path} className="border-t">
                        <td className="break-all p-3">{p.path}</td>
                        <td className="p-3">{p.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h3 className="font-bold">Klik penting per halaman</h3>
              <div className="overflow-x-auto border bg-white">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th className="p-3">Halaman</th>
                      <th className="p-3">Tombol</th>
                      <th className="p-3">Klik</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.clicks.map((p) => (
                      <tr key={p.path + p.event} className="border-t">
                        <td className="break-all p-3">{p.path}</td>
                        <td className="p-3">
                          {analyticsLabels[p.event] ?? p.event}
                        </td>
                        <td className="p-3">{p.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h3 className="font-bold">Rekap harian (WIB)</h3>
              <div className="max-h-80 overflow-auto border bg-white">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">Kegiatan</th>
                      <th className="p-3">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.daily.map((p) => (
                      <tr key={p.day + p.event} className="border-t">
                        <td className="p-3">{p.day}</td>
                        <td className="p-3">
                          {analyticsLabels[p.event] ?? p.event}
                        </td>
                        <td className="p-3">{p.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p>Memuat statistik…</p>
          )}
        </section>
      )}
      {tab === 'Panduan Admin' && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Panduan Admin Rilis 1–5</h2>
          <Link
            href="/api/admin/guide"
            download
            prefetch={false}
            className="btn-secondary inline-flex"
          >
            Unduh panduan Admin
          </Link>
          {adminGuideSections.map((s) => (
            <section key={s.title} className="space-y-3 border bg-white p-4">
              <h3 className="text-lg font-bold">{s.title}</h3>
              <ol className="list-decimal space-y-2 pl-5 text-sm">
                {s.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          ))}
        </section>
      )}
    </div>
  );
}
