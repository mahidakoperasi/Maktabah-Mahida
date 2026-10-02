"use client";
import { useEffect, useState } from "react";
import {
  emptyPromotion,
  type Promotion,
  type PromotionSettings,
} from "@/lib/promotion-schema";
import PromotionDialog from "../PromotionDialog";
import ImageUrlPreview from "./ImageUrlPreview";
type Response = PromotionSettings & {
  observedAt: number;
  draft: Promotion;
  statistics: { view: number; close: number; click: number };
};
function localTime(value: string | null) {
  return value
    ? new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 16)
    : "";
}
function utcTime(value: string) {
  return value ? new Date(value + ":00+07:00").toISOString() : null;
}
export default function PromotionManager() {
  const [data, setData] = useState<Response | null>(null);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    fetch("/api/admin/promotion", { cache: "no-store" })
      .then(async (r) => {
        const value = await r.json();
        if (!r.ok) throw Error(value.error);
        if (alive) setData(value);
      })
      .catch((e) => {
        if (alive) setError(e.message || "Pengaturan gagal dimuat.");
      });
    return () => {
      alive = false;
    };
  }, []);
  function patch(value: Partial<Promotion>) {
    setData((previous) =>
      previous
        ? { ...previous, draft: { ...previous.draft, ...value } }
        : previous,
    );
  }
  async function save(action: "save" | "publish" | "pause") {
    if (!data || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/promotion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          draft: data.draft,
          protectionEnabled: data.protectionEnabled,
        }),
      });
      const value = await response.json();
      if (!response.ok) throw Error(value.error || "Gagal menyimpan.");
      setData(value);
      setMessage(
        action === "save"
          ? "Draf promosi dan pengaturan proteksi tersimpan."
          : action === "publish"
            ? "Promosi diterbitkan sesuai jadwal."
            : "Promosi tayang dijeda.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  }
  const input =
    "mt-2 w-full rounded border border-mahida-200 bg-white p-3 text-sm";
  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-serif font-bold">
          Proteksi &amp; Promosi
        </h1>
        <p className="mt-2 text-sm text-warm-gray-600">
          Atur area bacaan publik dan pop-up promosi Mahida.
        </p>
      </header>
      {error && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="rounded border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {message}
        </p>
      )}
      {!data ? (
        !error && <p>Memuat pengaturan…</p>
      ) : (
        <>
          <section className="space-y-3 rounded border border-mahida-200 bg-white p-5">
            <h2 className="font-semibold">Format dan proteksi konten</h2>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={data.protectionEnabled}
                onChange={(e) =>
                  setData({ ...data, protectionEnabled: e.target.checked })
                }
              />
              Aktifkan anti-copas pada area bacaan publik
            </label>
            <p className="text-sm text-warm-gray-600">
              Artikel, Esai, Berita dan Terjemahan memakai proteksi seleksi,
              salin dan seret. Editor admin serta kontrol tetap dapat digunakan.
              Amiri otomatis untuk teks Arab; paragraf justify di HP dan desktop
              dengan arah tulisan otomatis.
            </p>
            <p className="text-xs text-warm-gray-500">
              Proteksi menghambat penyalinan biasa; tangkapan layar, OCR dan
              pengambilan teknis masih mungkin.
            </p>
          </section>
          <section className="space-y-5 rounded border border-mahida-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">Draf promosi</h2>
              <button
                type="button"
                disabled={busy}
                className="btn-secondary text-sm"
                onClick={() => {
                  patch(emptyPromotion(crypto.randomUUID()));
                  setMessage(
                    "Draf kampanye baru dibuat. Versi tayang tetap aktif sampai Anda menerbitkan atau menjedanya.",
                  );
                }}
              >
                Kampanye Baru
              </button>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">
                Judul promosi
                <input
                  aria-label="Judul promosi"
                  className={input}
                  maxLength={160}
                  value={data.draft.title}
                  onChange={(e) => patch({ title: e.target.value })}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                Keterangan
                <textarea
                  aria-label="Keterangan"
                  className={input}
                  rows={3}
                  maxLength={600}
                  value={data.draft.description}
                  onChange={(e) => patch({ description: e.target.value })}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                URL poster Google Drive
                <input
                  aria-label="URL poster Google Drive"
                  className={input}
                  maxLength={2000}
                  value={data.draft.posterUrl}
                  onChange={(e) => patch({ posterUrl: e.target.value })}
                />
                <ImageUrlPreview url={data.draft.posterUrl} />
              </label>
              <label className="text-sm">
                Teks tombol
                <input
                  aria-label="Teks tombol"
                  className={input}
                  maxLength={80}
                  value={data.draft.buttonLabel}
                  onChange={(e) => patch({ buttonLabel: e.target.value })}
                />
              </label>
              <label className="text-sm">
                Tujuan tombol
                <input
                  aria-label="Tujuan tombol"
                  className={input}
                  maxLength={2000}
                  value={data.draft.buttonUrl}
                  onChange={(e) => patch({ buttonUrl: e.target.value })}
                />
                <span className="mt-1 block text-xs text-warm-gray-500">
                  Alamat internal atau HTTPS; contoh /tentang/pendaftaran.
                </span>
              </label>
              <label className="text-sm">
                Mulai tampil (WIB)
                <input
                  aria-label="Mulai tampil (WIB)"
                  type="datetime-local"
                  className={input}
                  value={localTime(data.draft.startsAt)}
                  onChange={(e) => patch({ startsAt: utcTime(e.target.value) })}
                />
              </label>
              <label className="text-sm">
                Selesai tampil (WIB)
                <input
                  aria-label="Selesai tampil (WIB)"
                  type="datetime-local"
                  className={input}
                  value={localTime(data.draft.endsAt)}
                  onChange={(e) => patch({ endsAt: utcTime(e.target.value) })}
                />
              </label>
            </div>
            <p className="text-xs text-warm-gray-500">
              Kosongkan jadwal untuk tanpa batas waktu. Poster harus dapat
              dilihat publik dan akan diperiksa sebelum terbit.
            </p>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={data.draft.enabled}
                onChange={(e) => patch({ enabled: e.target.checked })}
              />
              Aktifkan promosi saat diterbitkan
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={data.draft.statisticsEnabled}
                onChange={(e) => patch({ statisticsEnabled: e.target.checked })}
              />
              Catat jumlah tampil, ditutup dan klik tombol
            </label>
            <p className="text-xs text-warm-gray-500">
              Statistik berupa hitungan per hari selama 180 hari, bukan
              pengunjung unik. Pratinjau, bot, admin, Do Not Track dan Global
              Privacy Control dikecualikan.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                className="btn-secondary"
                onClick={() => save("save")}
              >
                Simpan Draf &amp; Proteksi
              </button>
              <button
                type="button"
                disabled={busy}
                className="btn-secondary"
                onClick={() => setPreview(true)}
              >
                Pratinjau Pop-up
              </button>
              <button
                type="button"
                disabled={busy}
                className="btn-primary"
                onClick={() => save("publish")}
              >
                {busy ? "Memproses…" : "Terbitkan Promosi"}
              </button>
            </div>
          </section>
          <section className="space-y-4 rounded border border-mahida-200 bg-white p-5">
            <h2 className="font-semibold">Promosi terbit &amp; statistik</h2>
            <p className="text-sm">
              {data.published
                ? `${data.published.title} — ${!data.published.enabled ? "Dijeda" : data.published.endsAt && Date.parse(data.published.endsAt) <= data.observedAt ? "Selesai" : data.published.startsAt && Date.parse(data.published.startsAt) > data.observedAt ? "Terjadwal" : "Aktif"}`
                : "Belum ada promosi terbit."}
            </p>
            <dl className="grid grid-cols-3 gap-3">
              {(
                [
                  ["view", "Tampil"],
                  ["close", "Ditutup"],
                  ["click", "Klik tombol"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="rounded bg-mahida-50 p-3">
                  <dt className="text-xs text-warm-gray-600">{label}</dt>
                  <dd className="mt-1 text-xl font-semibold">
                    {data.statistics[key].toLocaleString("id-ID")}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-warm-gray-600">
              Pop-up muncul pada halaman publik pertama yang dikunjungi. Setelah
              ditutup, navigasi internal tidak memunculkannya lagi. Refresh
              memulai kunjungan baru.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="btn-secondary"
                disabled={busy || !data.published?.enabled}
                onClick={() => save("pause")}
              >
                Jeda Promosi Tayang
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={busy}
                onClick={async () => {
                  try {
                    const response = await fetch("/api/admin/promotion", {
                      cache: "no-store",
                    });
                    if (!response.ok) throw Error();
                    const value = await response.json();
                    setData((previous) =>
                      previous
                        ? {
                            ...previous,
                            observedAt: value.observedAt,
                            published: value.published,
                            statistics: value.statistics,
                          }
                        : previous,
                    );
                  } catch {
                    setError("Statistik gagal dimuat.");
                  }
                }}
              >
                Perbarui Statistik
              </button>
            </div>
          </section>
          {preview && (
            <PromotionDialog
              key={data.draft.id}
              promotion={data.draft}
              preview
              onDismiss={() => setPreview(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
