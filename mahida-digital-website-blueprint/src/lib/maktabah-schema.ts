import { z } from "zod";
import { publicImageUrl } from "./media-links";
import { socialLinkSchema, contactLinkSchema } from "./public-directory";
export const librarySections = [
  "intro",
  "search",
  "fans",
  "featured",
  "latest",
  "about",
] as const;
export const sectionNames = {
  intro: "Nama & pengantar",
  search: "Pencarian",
  fans: "Fan Kitab",
  featured: "Kitab Pilihan",
  latest: "Terjemahan Terbaru",
  about: "Tentang Koleksi",
};
const image = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (v) => !v || Boolean(publicImageUrl(v)),
    "Gunakan gambar HTTPS atau tautan Drive yang valid.",
  );
export function docsId(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" &&
      u.hostname === "docs.google.com" &&
      !u.username &&
      !u.password
      ? (/^\/document\/d\/([\w-]{10,})\//.exec(u.pathname + "/")?.[1] ?? null)
      : null;
  } catch {
    return null;
  }
}
const short = z.string().trim().max(500);
const destination = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => {
    if (!value) return true;
    if (/[\\\u0000-\u0020]/.test(value)) return false;
    if (value.startsWith("/") && !value.startsWith("//")) return true;
    try {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        Boolean(url.hostname) &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, "Gunakan tujuan HTTPS atau jalur internal seperti /tentang/pendaftaran.");
export const libraryBannerSchema = z
  .object({
    enabled: z.boolean().default(false),
    title: short.default(""),
    description: z.string().max(10000).default(""),
    imageUrl: image.default(""),
    mobileImageUrl: image.default(""),
    imageAlt: short.default(""),
    placement: z
      .enum(["left", "right", "above", "below", "background"])
      .default("right"),
    textAlign: z.enum(["left", "center", "right"]).default("left"),
    height: z.number().int().min(180).max(640).default(320),
    focalX: z.number().int().min(0).max(100).default(50),
    focalY: z.number().int().min(0).max(100).default(50),
    buttonLabel: short.default(""),
    buttonUrl: destination.default(""),
  })
  .refine(
    (v) => !v.enabled || !v.buttonLabel || Boolean(v.buttonUrl),
    "Isi tujuan tombol banner.",
  );
export const footerGroups = ["socials", "contacts", "join"] as const;
export const footerGroupNames = {
  socials: "Media sosial",
  contacts: "Kontak",
  join: "Gabung bersama kami",
};
export const libraryFooterSchema = z
  .object({
    enabled: z.boolean().default(true),
    source: z.enum(["mahida", "custom"]).default("mahida"),
    socials: z.array(socialLinkSchema).max(30).default([]),
    contacts: z.array(contactLinkSchema).max(30).default([]),
    address: short.default(""),
    socialsTitle: short.default("Media sosial"),
    contactsTitle: short.default("Kontak"),
    joinTitle: short.default("Gabung bersama kami"),
    joinDescription: z
      .string()
      .trim()
      .max(2000)
      .default("Bersama merawat tradisi ilmu dan kehidupan pesantren."),
    joinLabel: short.default("Daftar / Gabung"),
    joinUrl: destination.default("/tentang/pendaftaran"),
    groups: z
      .array(z.object({ id: z.enum(footerGroups), visible: z.boolean() }))
      .length(3)
      .refine(
        (v) => new Set(v.map((s) => s.id)).size === 3,
        "Setiap kelompok footer harus tersedia tepat satu kali.",
      )
      .default(footerGroups.map((id) => ({ id, visible: true }))),
  })
  .superRefine((value, ctx) => {
    const ids = [...value.socials, ...value.contacts].map((item) => item.id);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({
        code: "custom",
        message: "ID tautan footer tidak boleh sama.",
      });
  });
export const bookSchema = z.object({
  title: short.min(1),
  arabicTitle: short.default(""),
  summary: z.string().trim().max(10000).default(""),
  authorName: short.default(""),
  translatorName: short.default(""),
  contributorName: short.default(""),
  editorName: short.default(""),
  primaryFan: z
    .string()
    .regex(/^[a-z0-9-]{1,100}$/)
    .default("koleksi-terjemahan"),
  additionalFans: z
    .array(z.string().regex(/^[a-z0-9-]{1,100}$/))
    .max(20)
    .default([]),
  coverUrl: image.default(""),
  coverAlt: short.default(""),
  preface: z.string().max(100000).default(""),
  docsUrl: z
    .string()
    .trim()
    .max(2000)
    .refine(
      (v) => !v || Boolean(docsId(v)),
      "Gunakan tautan Google Docs /document/d/…",
    )
    .default(""),
  sourceNote: z.string().max(10000).default(""),
  completion: z.enum(["complete", "ongoing"]).default("ongoing"),
  featured: z.boolean().default(false),
  featuredOrder: z.number().int().min(0).max(10000).default(0),
  coverPlacement: z.enum(["left", "right", "top"]).default("left"),
  legacyContent: z.string().max(1000000).default(""),
});
export type BookMeta = z.infer<typeof bookSchema>;
export const fanSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{1,100}$/),
  name: short.min(1),
  intro: z.string().max(10000).default(""),
  imageUrl: image.default(""),
  imageAlt: short.default(""),
  sortOrder: z.number().int().min(0).max(10000).default(0),
  visible: z.boolean().default(true),
});
export type Fan = z.infer<typeof fanSchema> & {
  revision: number;
  count?: number;
};
const section = z.object({
  id: z.enum(librarySections),
  title: short,
  visible: z.boolean(),
  imageUrl: image.default(""),
  imageAlt: short.default(""),
  imagePlacement: z.enum(["left", "right", "above", "below"]).default("right"),
});
export const librarySettingsSchema = z.object({
  name: short.min(1),
  intro: z.string().max(10000),
  about: z.string().max(10000),
  logoUrl: image,
  columns: z.enum(["2", "3", "4"]),
  cardStyle: z.enum(["cover", "compact"]),
  banner: libraryBannerSchema.prefault({}),
  footer: libraryFooterSchema.prefault({}),
  sections: z
    .array(section)
    .length(6)
    .refine(
      (v) => new Set(v.map((s) => s.id)).size === 6,
      "Setiap bagian harus tersedia tepat satu kali.",
    ),
});
export type LibrarySettings = z.infer<typeof librarySettingsSchema>;
export const defaultLibrarySettings: LibrarySettings = {
  name: "Maktabah Mahida",
  intro:
    "Ruang membaca terjemahan kitab, menelaah ilmu, dan merawat tradisi keilmuan pesantren.",
  about:
    "Koleksi terjemahan kitab Mahida disusun berdasarkan fan keilmuan. Informasi sumber, penerjemah, dan penyunting tersedia pada setiap kitab.",
  logoUrl: "",
  columns: "3",
  cardStyle: "cover",
  banner: libraryBannerSchema.parse({}),
  footer: libraryFooterSchema.parse({}),
  sections: librarySections.map((id) => ({
    id,
    title: id === "intro" ? "Perpustakaan Terjemahan Kitab" : sectionNames[id],
    visible: true,
    imageUrl: "",
    imageAlt: "",
    imagePlacement: "right",
  })),
};
