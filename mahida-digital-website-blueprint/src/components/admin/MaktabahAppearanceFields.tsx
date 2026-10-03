"use client";

import Link from "next/link";
import { footerGroupNames, type LibrarySettings } from "@/lib/maktabah-schema";
import type {
  ContactLink,
  PublicDirectory,
  SocialLink,
} from "@/lib/public-directory";
import ImageUrlPreview from "./ImageUrlPreview";
import RichTextField from "./RichTextField";

export default function MaktabahAppearanceFields({
  value,
  onChange,
  directory,
}: {
  value: LibrarySettings;
  onChange: (value: LibrarySettings) => void;
  directory: PublicDirectory;
}) {
  const b = value.banner,
    f = value.footer;
  function banner(patch: Partial<LibrarySettings["banner"]>) {
    onChange({ ...value, banner: { ...b, ...patch } });
  }
  function footer(patch: Partial<LibrarySettings["footer"]>) {
    onChange({ ...value, footer: { ...f, ...patch } });
  }
  function social(id: string, patch: Partial<SocialLink>) {
    footer({
      socials: f.socials.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  }
  function contact(id: string, patch: Partial<ContactLink>) {
    footer({
      contacts: f.contacts.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  }
  return (
    <>
      <fieldset className="rounded border bg-white p-4 space-y-4">
        <legend className="font-bold text-xl">Pencarian & catatan kaki</legend>
        <div className="admin-library-fields">
          {(
            [
              ["label", "Label pencarian"],
              ["placeholder", "Petunjuk kolom pencarian"],
              ["buttonLabel", "Teks tombol pencarian"],
              ["resultsTitle", "Judul halaman hasil"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="admin-library-field">
              {label}
              <input
                maxLength={200}
                value={value.search[key]}
                onChange={(e) =>
                  onChange({
                    ...value,
                    search: { ...value.search, [key]: e.target.value },
                  })
                }
              />
            </label>
          ))}
          <label className="admin-library-field">
            Ukuran huruf catatan kaki (14–24 px)
            <input
              type="number"
              min={14}
              max={24}
              value={value.reading.footnoteFontSize}
              onChange={(e) =>
                onChange({
                  ...value,
                  reading: {
                    ...value.reading,
                    footnoteFontSize: Number(e.target.value),
                  },
                })
              }
            />
          </label>
        </div>
        <label className="flex items-center gap-2 min-h-11">
          <input
            type="checkbox"
            checked={value.reading.searchFootnotes}
            onChange={(e) =>
              onChange({
                ...value,
                reading: {
                  ...value.reading,
                  searchFootnotes: e.target.checked,
                },
              })
            }
          />
          Sertakan catatan kaki dalam pencarian
        </label>
        <p className="text-sm">
          Tambahkan catatan kaki melalui fitur Catatan kaki di Google Docs, lalu
          sinkronkan kitab. Nomor dan formatnya mengikuti dokumen sumber.
          Pengaturan ini berlaku setelah diterbitkan.
        </p>
      </fieldset>
      <fieldset className="rounded border bg-white p-4 space-y-4">
        <legend className="font-bold text-xl">Banner Maktabah</legend>
        <p className="text-sm">
          Banner menggantikan tampilan bagian Nama & pengantar. Posisi dan
          penayangannya mengikuti susunan bagian beranda di bawah. Kosongkan
          judul atau pengantar banner untuk mengikuti identitas Maktabah.
        </p>
        <label className="flex items-center gap-2 min-h-11">
          <input
            type="checkbox"
            checked={b.enabled}
            onChange={(e) => banner({ enabled: e.target.checked })}
          />
          Aktifkan banner
        </label>
        <label className="admin-library-field">
          Judul banner
          <input
            maxLength={500}
            value={b.title}
            placeholder={value.name}
            onChange={(e) => banner({ title: e.target.value })}
          />
        </label>
        <RichTextField
          label="Pengantar banner"
          value={b.description}
          onChange={(description) => banner({ description })}
        />
        <div className="admin-library-fields">
          <label className="admin-library-field">
            Gambar banner — HTTPS / Drive
            <input
              maxLength={2000}
              value={b.imageUrl}
              onChange={(e) => banner({ imageUrl: e.target.value })}
            />
          </label>
          <label className="admin-library-field">
            Gambar banner khusus HP — opsional
            <input
              maxLength={2000}
              value={b.mobileImageUrl}
              onChange={(e) => banner({ mobileImageUrl: e.target.value })}
            />
          </label>
          <label className="admin-library-field">
            Teks alternatif banner
            <input
              maxLength={500}
              value={b.imageAlt}
              onChange={(e) => banner({ imageAlt: e.target.value })}
            />
          </label>
          <label className="admin-library-field">
            Posisi gambar banner
            <select
              value={b.placement}
              onChange={(e) =>
                banner({ placement: e.target.value as typeof b.placement })
              }
            >
              <option value="left">Kiri teks</option>
              <option value="right">Kanan teks</option>
              <option value="above">Di atas teks</option>
              <option value="below">Di bawah teks</option>
              <option value="background">Latar belakang teks</option>
            </select>
          </label>
          <label className="admin-library-field">
            Perataan teks banner
            <select
              value={b.textAlign}
              onChange={(e) =>
                banner({ textAlign: e.target.value as typeof b.textAlign })
              }
            >
              <option value="left">Kiri</option>
              <option value="center">Tengah</option>
              <option value="right">Kanan</option>
            </select>
          </label>
          <label className="admin-library-field">
            Tinggi minimum banner desktop (px)
            <input
              type="number"
              min={180}
              max={640}
              value={b.height}
              onChange={(e) => banner({ height: Number(e.target.value) })}
            />
          </label>
          <label className="admin-library-field">
            Fokus gambar horizontal (%)
            <input
              type="number"
              min={0}
              max={100}
              value={b.focalX}
              onChange={(e) => banner({ focalX: Number(e.target.value) })}
            />
          </label>
          <label className="admin-library-field">
            Fokus gambar vertikal (%)
            <input
              type="number"
              min={0}
              max={100}
              value={b.focalY}
              onChange={(e) => banner({ focalY: Number(e.target.value) })}
            />
          </label>
          <label className="admin-library-field">
            Teks tombol banner — kosong untuk sembunyikan
            <input
              maxLength={500}
              value={b.buttonLabel}
              onChange={(e) => banner({ buttonLabel: e.target.value })}
            />
          </label>
          <label className="admin-library-field">
            Tujuan tombol banner
            <input
              maxLength={2000}
              value={b.buttonUrl}
              placeholder="/maktabah/fan atau https://…"
              onChange={(e) => banner({ buttonUrl: e.target.value })}
            />
          </label>
        </div>
        <ImageUrlPreview
          url={b.imageUrl}
          label={b.imageAlt || "Banner desktop"}
        />
        <ImageUrlPreview
          url={b.mobileImageUrl}
          label={b.imageAlt || "Banner HP"}
        />
      </fieldset>
      <fieldset className="rounded border bg-white p-4 space-y-4">
        <legend className="font-bold text-xl">Footer Maktabah</legend>
        <p className="text-sm">
          Footer ringkas berisi medsos, kontak, dan ajakan bergabung. Tampil
          setelah akhir isi pada pembaca kitab.
        </p>
        <label className="flex items-center gap-2 min-h-11">
          <input
            type="checkbox"
            checked={f.enabled}
            onChange={(e) => footer({ enabled: e.target.checked })}
          />
          Tampilkan footer Maktabah
        </label>
        <label className="admin-library-field">
          Sumber medsos dan kontak
          <select
            value={f.source}
            onChange={(e) =>
              footer({ source: e.target.value as typeof f.source })
            }
          >
            <option value="mahida">Ikuti pengaturan Mahida</option>
            <option value="custom">Khusus Maktabah</option>
          </select>
        </label>
        {f.source === "mahida" ? (
          <p className="text-sm">
            Akun dan kontak aktif mengikuti{" "}
            <Link href="/admin/tampilan/kontak" className="underline">
              Media Sosial & Kontak Mahida
            </Link>
            . Pilih Khusus Maktabah untuk mengedit atau menyeleksi tautan secara
            terpisah.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={() =>
                footer({
                  socials: structuredClone(directory.socials),
                  contacts: structuredClone(directory.contacts),
                })
              }
            >
              Salin medsos dan kontak Mahida
            </button>
            <p className="text-sm">
              Salinan dapat diedit tanpa mengubah pengaturan Mahida. Jika sudah
              ada tautan khusus, tombol salin menggantikannya.
            </p>
            <div className="admin-library-actions">
              <h3 className="font-bold">Akun medsos khusus</h3>
              <button
                type="button"
                disabled={f.socials.length >= 30}
                onClick={() =>
                  footer({
                    socials: [
                      ...f.socials,
                      {
                        id: crypto.randomUUID(),
                        platform: "instagram",
                        label: "Akun baru",
                        url: "",
                        isVisible: false,
                        sortOrder: f.socials.length,
                      },
                    ],
                  })
                }
              >
                Tambah medsos Maktabah
              </button>
            </div>
            {f.socials.map((item) => (
              <fieldset key={item.id} className="rounded border p-3 space-y-3">
                <legend>Akun: {item.label}</legend>
                <div className="admin-library-fields">
                  <label className="admin-library-field">
                    Platform
                    <select
                      value={item.platform}
                      onChange={(e) =>
                        social(item.id, {
                          platform: e.target.value as SocialLink["platform"],
                        })
                      }
                    >
                      <option value="instagram">Instagram</option>
                      <option value="youtube">YouTube</option>
                      <option value="facebook">Facebook</option>
                      <option value="tiktok">TikTok</option>
                      <option value="x">X</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </label>
                  <label className="admin-library-field">
                    Nama akun
                    <input
                      maxLength={100}
                      value={item.label}
                      onChange={(e) =>
                        social(item.id, { label: e.target.value })
                      }
                    />
                  </label>
                  <label className="admin-library-field">
                    URL akun HTTPS
                    <input
                      value={item.url}
                      maxLength={2048}
                      onChange={(e) => social(item.id, { url: e.target.value })}
                    />
                  </label>
                  <label className="admin-library-field">
                    Urutan akun
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      value={item.sortOrder}
                      onChange={(e) =>
                        social(item.id, { sortOrder: Number(e.target.value) })
                      }
                    />
                  </label>
                </div>
                <div className="admin-library-actions">
                  <label className="flex items-center gap-2 min-h-11">
                    <input
                      type="checkbox"
                      checked={item.isVisible}
                      onChange={(e) =>
                        social(item.id, { isVisible: e.target.checked })
                      }
                    />
                    Tampilkan akun
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      footer({
                        socials: f.socials.filter((s) => s.id !== item.id),
                      })
                    }
                  >
                    Hapus akun
                  </button>
                </div>
              </fieldset>
            ))}
            <div className="admin-library-actions">
              <h3 className="font-bold">Kontak khusus</h3>
              <button
                type="button"
                disabled={f.contacts.length >= 30}
                onClick={() =>
                  footer({
                    contacts: [
                      ...f.contacts,
                      {
                        id: crypto.randomUUID(),
                        category: "umum",
                        channel: "whatsapp",
                        label: "Kontak baru",
                        value: "",
                        isVisible: false,
                        sortOrder: f.contacts.length,
                      },
                    ],
                  })
                }
              >
                Tambah kontak Maktabah
              </button>
            </div>
            {f.contacts.map((item) => (
              <fieldset key={item.id} className="rounded border p-3 space-y-3">
                <legend>Kontak: {item.label}</legend>
                <div className="admin-library-fields">
                  <label className="admin-library-field">
                    Jenis kontak
                    <select
                      value={item.channel}
                      onChange={(e) =>
                        contact(item.id, {
                          channel: e.target.value as ContactLink["channel"],
                          category: "umum",
                          value: "",
                        })
                      }
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="telepon">Telepon</option>
                      <option value="email">Email</option>
                      <option value="website">Tautan HTTPS</option>
                    </select>
                  </label>
                  <label className="admin-library-field">
                    Label kontak
                    <input
                      maxLength={100}
                      value={item.label}
                      onChange={(e) =>
                        contact(item.id, { label: e.target.value })
                      }
                    />
                  </label>
                  <label className="admin-library-field">
                    {item.channel === "email"
                      ? "Alamat email"
                      : item.channel === "website"
                        ? "Tujuan kontak HTTPS"
                        : "Nomor kontak internasional — 628…, tanpa spasi"}
                    <input
                      value={item.value}
                      maxLength={2048}
                      onChange={(e) =>
                        contact(item.id, { value: e.target.value })
                      }
                    />
                  </label>
                  <label className="admin-library-field">
                    Urutan kontak
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      value={item.sortOrder}
                      onChange={(e) =>
                        contact(item.id, { sortOrder: Number(e.target.value) })
                      }
                    />
                  </label>
                </div>
                <div className="admin-library-actions">
                  <label className="flex items-center gap-2 min-h-11">
                    <input
                      type="checkbox"
                      checked={item.isVisible}
                      onChange={(e) =>
                        contact(item.id, { isVisible: e.target.checked })
                      }
                    />
                    Tampilkan kontak
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      footer({
                        contacts: f.contacts.filter((c) => c.id !== item.id),
                      })
                    }
                  >
                    Hapus kontak
                  </button>
                </div>
              </fieldset>
            ))}
          </>
        )}
        <div className="admin-library-fields">
          <label className="admin-library-field">
            Judul kelompok medsos
            <input
              maxLength={500}
              value={f.socialsTitle}
              onChange={(e) => footer({ socialsTitle: e.target.value })}
            />
          </label>
          <label className="admin-library-field">
            Judul kelompok kontak
            <input
              maxLength={500}
              value={f.contactsTitle}
              onChange={(e) => footer({ contactsTitle: e.target.value })}
            />
          </label>
          <label className="admin-library-field">
            Alamat singkat — opsional
            <textarea
              rows={3}
              maxLength={500}
              value={f.address}
              onChange={(e) => footer({ address: e.target.value })}
            />
          </label>
          <label className="admin-library-field">
            Judul ajakan bergabung
            <input
              maxLength={500}
              value={f.joinTitle}
              onChange={(e) => footer({ joinTitle: e.target.value })}
            />
          </label>
          <label className="admin-library-field">
            Teks ajakan bergabung
            <textarea
              rows={3}
              maxLength={2000}
              value={f.joinDescription}
              onChange={(e) => footer({ joinDescription: e.target.value })}
            />
          </label>
          <label className="admin-library-field">
            Label tombol daftar / gabung
            <input
              maxLength={500}
              value={f.joinLabel}
              onChange={(e) => footer({ joinLabel: e.target.value })}
            />
          </label>
          <label className="admin-library-field">
            Tujuan tombol daftar / gabung
            <input
              maxLength={2000}
              value={f.joinUrl}
              onChange={(e) => footer({ joinUrl: e.target.value })}
            />
          </label>
        </div>
        <p className="text-sm">
          Kosongkan judul untuk menyembunyikan judul kelompok. Kosongkan label
          atau tujuan tombol untuk menyembunyikan tombol.
        </p>
        <h3 className="font-bold">Urutan dan penayangan kelompok footer</h3>
        {f.groups.map((group, index) => (
          <div key={group.id} className="admin-library-actions">
            <label className="flex items-center gap-2 min-h-11">
              <input
                type="checkbox"
                checked={group.visible}
                onChange={(e) =>
                  footer({
                    groups: f.groups.map((s) =>
                      s.id === group.id
                        ? { ...s, visible: e.target.checked }
                        : s,
                    ),
                  })
                }
              />
              {footerGroupNames[group.id]}
            </label>
            {[-1, 1].map((offset) => (
              <button
                key={offset}
                type="button"
                aria-label={`${offset < 0 ? "Naikkan" : "Turunkan"} ${footerGroupNames[group.id]}`}
                disabled={
                  index + offset < 0 || index + offset >= f.groups.length
                }
                onClick={() => {
                  const groups = [...f.groups];
                  [groups[index], groups[index + offset]] = [
                    groups[index + offset],
                    groups[index],
                  ];
                  footer({ groups });
                }}
              >
                {offset < 0 ? "Naik" : "Turun"}
              </button>
            ))}
          </div>
        ))}
      </fieldset>
    </>
  );
}
