"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  bookSchema,
  defaultLibrarySettings,
  sectionNames,
  type BookMeta,
  type Fan,
  type LibrarySettings,
} from "@/lib/maktabah-schema";
import type { BookRow } from "@/lib/maktabah-store";
import type { Chapter } from "@/lib/kitab-content";
import RichTextField from "./RichTextField";
import KitabBlocks from "../KitabBlocks";
import ImageUrlPreview from "./ImageUrlPreview";
import MaktabahAppearanceFields from "./MaktabahAppearanceFields";
import type { PublicDirectory } from "@/lib/public-directory";
type Data = {
  books: BookRow[];
  fans: Fan[];
  settings: { draft: LibrarySettings; revision: number };
  docsConfigured: boolean;
  directory: PublicDirectory;
};
const blankFan: Fan = {
  slug: "",
  name: "",
  intro: "",
  imageUrl: "",
  imageAlt: "",
  sortOrder: 120,
  visible: true,
  revision: 0,
};
export default function MaktabahManager() {
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState("kitab");
  const [id, setId] = useState<number | undefined>();
  const [revision, setRevision] = useState(0);
  const [meta, setMeta] = useState<BookMeta>(
    bookSchema.parse({ title: "Kitab Baru" }),
  );
  const [fan, setFan] = useState<Fan>(blankFan);
  const [layout, setLayout] = useState(defaultLibrarySettings);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Chapter[] | null>(null);
  const [layoutPreview, setLayoutPreview] = useState<{
    width: number;
    version: number;
  } | null>(null);
  async function load() {
    const r = await fetch("/api/admin/maktabah", { cache: "no-store" });
    const result = await r.json();
    if (!r.ok) throw Error(result.error);
    setData(result);
    setLayout(result.settings.draft);
    return result as Data;
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/maktabah", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (r) => {
        const result = await r.json();
        if (!r.ok) throw Error(result.error);
        return result as Data;
      })
      .then((result) => {
        setData(result);
        setLayout(result.settings.draft);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, []);
  function choose(row: BookRow) {
    setId(row.post_id);
    setRevision(row.revision);
    setMeta(
      bookSchema.parse(
        row.draft ?? {
          title: row.title,
          summary: row.excerpt ?? "",
          coverUrl: row.featured_image ?? "",
          legacyContent: row.content_raw ?? "",
          contributorName: row.author_name ?? "",
        },
      ),
    );
    setPreview(null);
    setError("");
    setMessage("");
  }
  function update<K extends keyof BookMeta>(key: K, value: BookMeta[K]) {
    setMeta((old) => ({ ...old, [key]: value }));
  }
  async function send(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/admin/maktabah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "fan" || action.startsWith("layout-")
            ? { action, revision, ...extra }
            : { action, id, revision, meta, ...extra },
        ),
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error);
      if (result.result) {
        if (action === "preview") setPreview(result.result.chapters);
        setMessage(
          action === "test"
            ? `Koneksi berhasil: ${result.result.title}; ${result.result.chapters} bab.`
            : `${action === "sync" ? "Sinkronisasi berhasil." : "Pratinjau isi siap."} ${(result.result.warnings ?? []).join(" ")}`,
        );
        if (action === "sync") await load();
      } else {
        const fresh = await load();
        if (result.id) {
          setId(result.id);
          const row = fresh.books.find((b) => b.post_id === result.id);
          setRevision(row?.revision ?? result.revision);
        }
        if (action === "fan")
          setFan(fresh.fans.find((f) => f.slug === fan.slug) ?? fan);
        setMessage(
          action.includes("publish")
            ? "Berhasil diterbitkan."
            : action === "archive"
              ? "Kitab diarsipkan."
              : "Berhasil disimpan.",
        );
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memproses.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  function changeSection(index: number, key: string, value: unknown) {
    setLayout((old) => ({
      ...old,
      sections: old.sections.map((section, i) =>
        i === index ? { ...section, [key]: value } : section,
      ),
    }));
  }
  function moveSection(index: number, offset: number) {
    setLayout((old) => {
      const sections = [...old.sections];
      [sections[index], sections[index + offset]] = [
        sections[index + offset],
        sections[index],
      ];
      return { ...old, sections };
    });
  }
  async function previewLayout(width: number) {
    if (!data) return;
    if (
      await send("layout-save", {
        settings: layout,
        revision: data.settings.revision,
      })
    ) {
      setLayoutPreview((previous) => ({
        width,
        version: (previous?.version ?? 0) + 1,
      }));
    }
  }
  const row = data?.books.find((b) => b.post_id === id);
  const field = (key: keyof BookMeta, label: string) => (
    <label className="admin-library-field" key={key}>
      {label}
      <input
        value={String(meta[key])}
        onChange={(e) => update(key, e.target.value as never)}
      />
    </label>
  );
  return (
    <div className="admin-library">
      <h1 className="text-2xl font-bold">Maktabah & Terjemahan</h1>
      <p className="text-sm text-warm-gray-600">
        Satu entri kitab untuk Maktabah dan Terjemahan. Pengarang serta
        penerjemah adalah identitas kitab; koleksi dibagi berdasarkan fan.
      </p>
      <nav className="admin-library-tabs" aria-label="Pengelolaan Maktabah">
        {[
          ["kitab", "Kitab & Terjemahan"],
          ["fan", "Fan Kitab"],
          ["layout", "Tampilan Maktabah"],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={tab === value}
            onClick={() => {
              setTab(value);
              setError("");
              setMessage("");
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      {error && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="rounded border border-green-200 bg-green-50 p-3"
        >
          {message}
        </p>
      )}
      {!data ? (
        <p>Memuat…</p>
      ) : (
        <>
          {tab === "kitab" && (
            <div className="admin-library-grid">
              <aside>
                <button
                  onClick={() => {
                    setId(undefined);
                    setRevision(0);
                    setMeta(bookSchema.parse({ title: "Kitab Baru" }));
                    setPreview(null);
                  }}
                >
                  + Kitab Baru
                </button>
                <ul className="admin-library-book-list">
                  {data.books.map((book) => (
                    <li key={book.post_id}>
                      <button
                        aria-pressed={id === book.post_id}
                        onClick={() => choose(book)}
                      >
                        <strong>{book.draft?.title ?? book.title}</strong>
                        <span>
                          {book.status === "published"
                            ? "Terbit"
                            : book.status === "archived"
                              ? "Arsip"
                              : "Draf"}{" "}
                          ·{" "}
                          {book.blocked
                            ? "Sumber tidak tersedia"
                            : book.published?.completion === "complete"
                              ? "Lengkap"
                              : "Bertahap"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>
              <div className="space-y-5 min-w-0">
                <div className="admin-library-fields">
                  {field("title", "Judul kitab")}
                  {field("arabicTitle", "Judul Arab")}
                  {field("authorName", "Pengarang")}
                  {field("translatorName", "Penerjemah")}
                  {field("editorName", "Penyunting")}
                  {field("contributorName", "Kontributor terjemahan lama")}
                  <label className="admin-library-field">
                    Fan utama
                    <select
                      value={meta.primaryFan}
                      onChange={(e) => update("primaryFan", e.target.value)}
                    >
                      {data.fans.map((f) => (
                        <option key={f.slug} value={f.slug}>
                          {f.name}
                          {f.visible ? "" : " (disembunyikan)"}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <fieldset>
                  <legend>Fan tambahan</legend>
                  <div className="flex flex-wrap gap-3">
                    {data.fans
                      .filter((f) => f.slug !== meta.primaryFan)
                      .map((f) => (
                        <label
                          key={f.slug}
                          className="flex items-center gap-2 min-h-11"
                        >
                          <input
                            type="checkbox"
                            checked={meta.additionalFans.includes(f.slug)}
                            onChange={(e) =>
                              update(
                                "additionalFans",
                                e.target.checked
                                  ? [...meta.additionalFans, f.slug]
                                  : meta.additionalFans.filter(
                                      (v) => v !== f.slug,
                                    ),
                              )
                            }
                          />
                          {f.name}
                        </label>
                      ))}
                  </div>
                </fieldset>
                <label className="admin-library-field">
                  Ringkasan
                  <textarea
                    value={meta.summary}
                    onChange={(e) => update("summary", e.target.value)}
                    rows={4}
                  />
                </label>
                {field("coverUrl", "Sampul — tautan Drive atau gambar HTTPS")}
                {field("coverAlt", "Teks alternatif sampul")}
                <ImageUrlPreview
                  url={meta.coverUrl}
                  label={meta.coverAlt || "Pratinjau sampul"}
                />
                <label className="admin-library-field">
                  Letak sampul halaman kitab
                  <select
                    value={meta.coverPlacement}
                    onChange={(e) =>
                      update(
                        "coverPlacement",
                        e.target.value as BookMeta["coverPlacement"],
                      )
                    }
                  >
                    <option value="left">Kiri</option>
                    <option value="right">Kanan</option>
                    <option value="top">Atas</option>
                  </select>
                </label>
                <RichTextField
                  key={`${id ?? "new"}-preface`}
                  value={meta.preface}
                  label="Kata pengantar"
                  bookTools
                  onChange={(value) => update("preface", value)}
                />
                <RichTextField
                  key={`${id ?? "new"}-source`}
                  value={meta.sourceNote}
                  label="Sumber & penyuntingan"
                  bookTools
                  onChange={(value) => update("sourceNote", value)}
                />
                {field("docsUrl", "Tautan Google Docs")}
                <p className="text-sm">
                  Gunakan dokumen khusus siap tayang. Heading 1 membentuk bab;
                  Heading 2 dan 3 membentuk subbagian. Perubahan sumber yang
                  terhubung mengikuti website sekitar setiap dua menit ketika
                  server aktif.
                </p>
                {!data.docsConfigured && (
                  <p className="rounded bg-amber-50 p-3 text-sm">
                    Google Docs API belum dikonfigurasi pada server. Isi lama
                    tetap dapat diterbitkan. Hubungkan identitas server sebelum
                    menggunakan Google Docs.
                  </p>
                )}
                {!meta.docsUrl && (
                  <RichTextField
                    value={meta.legacyContent}
                    label="Isi terjemahan lama / manual"
                    onChange={(value) => update("legacyContent", value)}
                  />
                )}
                <div className="admin-library-fields">
                  <label className="admin-library-field">
                    Status terjemahan
                    <select
                      value={meta.completion}
                      onChange={(e) =>
                        update(
                          "completion",
                          e.target.value as BookMeta["completion"],
                        )
                      }
                    >
                      <option value="ongoing">Terjemahan Bertahap</option>
                      <option value="complete">Lengkap</option>
                    </select>
                  </label>
                  <label className="admin-library-field">
                    Urutan kitab pilihan
                    <input
                      type="number"
                      min={0}
                      max={10000}
                      value={meta.featuredOrder}
                      onChange={(e) =>
                        update("featuredOrder", Number(e.target.value))
                      }
                    />
                  </label>
                </div>
                <label className="flex items-center gap-2 min-h-11">
                  <input
                    type="checkbox"
                    checked={meta.featured}
                    onChange={(e) => update("featured", e.target.checked)}
                  />
                  Kitab pilihan admin
                </label>
                <div className="admin-library-actions">
                  <button disabled={busy} onClick={() => send("save")}>
                    Simpan Draf Kitab
                  </button>
                  <button disabled={busy} onClick={() => send("publish")}>
                    Terbitkan Kitab
                  </button>
                  {row && (
                    <>
                      <Link
                        target="_blank"
                        href={`/maktabah/kitab/${row.slug}?maktabahPreview=1`}
                      >
                        Pratinjau Halaman Kitab
                      </Link>
                      <button disabled={busy} onClick={() => send("archive")}>
                        Arsipkan Kitab
                      </button>
                    </>
                  )}
                </div>
                <fieldset className="rounded border p-4 space-y-3">
                  <legend>Sinkronisasi Google Docs</legend>
                  <p className="text-sm">
                    Simpan draf sebelum menjalankan kontrol koneksi. Pratinjau
                    isi tidak mengganti isi yang tayang.
                  </p>
                  <div className="admin-library-actions">
                    {[
                      ["test", "Uji Koneksi"],
                      ["preview", "Pratinjau Isi"],
                      ["sync", "Sinkronkan Sekarang"],
                    ].map(([action, label]) => (
                      <button
                        key={action}
                        disabled={
                          busy || !id || !meta.docsUrl || !data.docsConfigured
                        }
                        onClick={() => send(action)}
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      disabled={busy || !id}
                      onClick={() =>
                        send("pause", { paused: !row?.sync_paused })
                      }
                    >
                      {row?.sync_paused
                        ? "Lanjutkan Sinkronisasi"
                        : "Jeda Sinkronisasi"}
                    </button>
                  </div>
                  <p className="text-sm">
                    Status:{" "}
                    {row?.blocked
                      ? "Sumber diblokir"
                      : row?.sync_paused
                        ? "Dijeda"
                        : "Aktif"}{" "}
                    · Sinkronisasi terakhir:{" "}
                    {row?.last_synced_at
                      ? new Date(row.last_synced_at).toLocaleString("id-ID")
                      : "Belum pernah"}
                  </p>
                  {row?.sync_error && (
                    <p role="alert" className="text-amber-800">
                      {row.sync_error}
                    </p>
                  )}
                  <p className="text-sm">
                    Kelengkapan:{" "}
                    {meta.title &&
                    meta.summary &&
                    meta.authorName &&
                    meta.translatorName &&
                    meta.coverUrl &&
                    meta.primaryFan
                      ? "Informasi utama lengkap"
                      : "Lengkapi judul, ringkasan, identitas, sampul, dan fan."}
                  </p>
                </fieldset>
                {preview && (
                  <section className="rounded border bg-white p-5">
                    <h2 className="text-xl font-bold">
                      Pratinjau isi Google Docs
                    </h2>
                    {preview.map((c) => (
                      <section key={c.id}>
                        <h3 className="font-bold my-5">{c.title}</h3>
                        <KitabBlocks blocks={c.blocks} />
                      </section>
                    ))}
                  </section>
                )}
              </div>
            </div>
          )}
          {tab === "fan" && (
            <div className="admin-library-grid">
              <aside>
                <button onClick={() => setFan({ ...blankFan })}>
                  + Fan Baru
                </button>
                <ul className="admin-library-book-list">
                  {data.fans.map((f) => (
                    <li key={f.slug}>
                      <button onClick={() => setFan(f)}>
                        {f.name} · {f.visible ? "Aktif" : "Disembunyikan"}
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>
              <div className="space-y-4">
                {[
                  ["name", "Nama fan"],
                  ["slug", "Kode fan (tetap setelah dibuat)"],
                  ["imageUrl", "Gambar fan"],
                  ["imageAlt", "Teks alternatif gambar fan"],
                ].map(([key, label]) => (
                  <label className="admin-library-field" key={key}>
                    {label}
                    <input
                      value={String(fan[key as keyof Fan])}
                      disabled={
                        key === "slug" &&
                        data.fans.some((f) => f.slug === fan.slug)
                      }
                      onChange={(e) =>
                        setFan((old) => ({ ...old, [key]: e.target.value }))
                      }
                    />
                  </label>
                ))}
                <label className="admin-library-field">
                  Pengantar fan
                  <textarea
                    rows={5}
                    value={fan.intro}
                    onChange={(e) =>
                      setFan((old) => ({ ...old, intro: e.target.value }))
                    }
                  />
                </label>
                <label className="admin-library-field">
                  Urutan fan
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={fan.sortOrder}
                    onChange={(e) =>
                      setFan((old) => ({
                        ...old,
                        sortOrder: Number(e.target.value),
                      }))
                    }
                  />
                </label>
                <label className="flex gap-2 items-center min-h-11">
                  <input
                    type="checkbox"
                    checked={fan.visible}
                    onChange={(e) =>
                      setFan((old) => ({ ...old, visible: e.target.checked }))
                    }
                  />
                  Tampilkan fan
                </label>
                <ImageUrlPreview
                  url={fan.imageUrl}
                  label={fan.imageAlt || fan.name}
                />
                <button
                  disabled={busy}
                  onClick={() => send("fan", { fan, revision: fan.revision })}
                >
                  Simpan Fan
                </button>
                <p className="text-sm">
                  Fan kosong otomatis tidak tampil di beranda. Menyembunyikan
                  fan tidak menghapus kitabnya.
                </p>
              </div>
            </div>
          )}
          {tab === "layout" && (
            <div className="space-y-5 max-w-5xl">
              {[
                ["name", "Nama Maktabah"],
                ["logoUrl", "Logo Maktabah — kosong mengikuti logo Mahida"],
              ].map(([key, label]) => (
                <label key={key} className="admin-library-field">
                  {label}
                  <input
                    value={layout[key as "name" | "logoUrl"]}
                    onChange={(e) =>
                      setLayout((old) => ({ ...old, [key]: e.target.value }))
                    }
                  />
                </label>
              ))}
              <RichTextField
                value={layout.intro}
                label="Pengantar Maktabah"
                onChange={(intro) => setLayout((old) => ({ ...old, intro }))}
              />
              <RichTextField
                value={layout.about}
                label="Penjelasan koleksi, sumber, dan penyuntingan"
                onChange={(about) => setLayout((old) => ({ ...old, about }))}
              />
              <MaktabahAppearanceFields
                value={layout}
                onChange={setLayout}
                directory={data.directory}
              />
              <div className="admin-library-fields">
                <label className="admin-library-field">
                  Kolom kartu desktop
                  <select
                    value={layout.columns}
                    onChange={(e) =>
                      setLayout((old) => ({
                        ...old,
                        columns: e.target.value as LibrarySettings["columns"],
                      }))
                    }
                  >
                    {["2", "3", "4"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                <label className="admin-library-field">
                  Gaya kartu
                  <select
                    value={layout.cardStyle}
                    onChange={(e) =>
                      setLayout((old) => ({
                        ...old,
                        cardStyle: e.target
                          .value as LibrarySettings["cardStyle"],
                      }))
                    }
                  >
                    <option value="cover">Sampul di atas</option>
                    <option value="compact">Sampul di samping</option>
                  </select>
                </label>
              </div>
              <h2 className="font-bold text-xl">Susunan bagian beranda</h2>
              {layout.sections.map((section, index) => (
                <fieldset
                  key={section.id}
                  className="rounded border bg-white p-4 space-y-3"
                >
                  <legend>{sectionNames[section.id]}</legend>
                  <div className="admin-library-actions">
                    <button
                      disabled={index === 0}
                      onClick={() => moveSection(index, -1)}
                    >
                      Naik
                    </button>
                    <button
                      disabled={index === layout.sections.length - 1}
                      onClick={() => moveSection(index, 1)}
                    >
                      Turun
                    </button>
                    <label className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={section.visible}
                        onChange={(e) =>
                          changeSection(index, "visible", e.target.checked)
                        }
                      />
                      Tampilkan bagian
                    </label>
                  </div>
                  <label className="admin-library-field">
                    Judul bagian
                    <input
                      value={section.title}
                      onChange={(e) =>
                        changeSection(index, "title", e.target.value)
                      }
                    />
                  </label>
                  <label className="admin-library-field">
                    Gambar bagian
                    <input
                      value={section.imageUrl}
                      onChange={(e) =>
                        changeSection(index, "imageUrl", e.target.value)
                      }
                    />
                  </label>
                  <label className="admin-library-field">
                    Teks alternatif gambar bagian
                    <input
                      value={section.imageAlt}
                      onChange={(e) =>
                        changeSection(index, "imageAlt", e.target.value)
                      }
                    />
                  </label>
                  <label className="admin-library-field">
                    Letak gambar
                    <select
                      value={section.imagePlacement}
                      onChange={(e) =>
                        changeSection(index, "imagePlacement", e.target.value)
                      }
                    >
                      <option value="left">Kiri</option>
                      <option value="right">Kanan</option>
                      <option value="above">Atas</option>
                      <option value="below">Bawah</option>
                    </select>
                  </label>
                  <ImageUrlPreview
                    url={section.imageUrl}
                    label={section.imageAlt || section.title}
                  />
                </fieldset>
              ))}
              <div className="admin-library-actions">
                <button
                  disabled={busy}
                  onClick={() =>
                    send("layout-save", {
                      settings: layout,
                      revision: data.settings.revision,
                    })
                  }
                >
                  Simpan Draf Tampilan
                </button>
                <Link target="_blank" href="/maktabah?maktabahPreview=1">
                  Pratinjau Tampilan
                </Link>
                <button
                  disabled={busy}
                  onClick={() =>
                    send("layout-publish", {
                      settings: layout,
                      revision: data.settings.revision,
                    })
                  }
                >
                  Terbitkan Tampilan
                </button>
                <Link target="_blank" href="/maktabah">
                  Lihat Maktabah
                </Link>
              </div>
              <p className="text-sm">
                Pratinjau ukuran layar menyimpan perubahan sebagai draf terlebih
                dahulu. Perubahan tampil ke pengunjung setelah Terbitkan
                Tampilan.
              </p>
              <div className="admin-library-actions">
                {[
                  [375, "HP"],
                  [768, "Tablet"],
                  [1440, "Desktop"],
                ].map(([width, label]) => (
                  <button
                    key={width}
                    disabled={busy}
                    aria-pressed={layoutPreview?.width === width}
                    onClick={() => previewLayout(Number(width))}
                  >
                    Pratinjau {label}
                  </button>
                ))}
              </div>
              {layoutPreview && (
                <div className="admin-library-preview-scroll">
                  <iframe
                    key={layoutPreview.version}
                    title={`Pratinjau Maktabah ${layoutPreview.width}px`}
                    src={`/maktabah?maktabahPreview=1&v=${layoutPreview.version}`}
                    style={{ width: layoutPreview.width, height: 720 }}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
