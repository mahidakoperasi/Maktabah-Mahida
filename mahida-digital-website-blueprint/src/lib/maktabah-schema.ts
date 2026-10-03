import { z } from "zod";
import { publicImageUrl } from "./media-links";
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
  sections: librarySections.map((id) => ({
    id,
    title: id === "intro" ? "Perpustakaan Terjemahan Kitab" : sectionNames[id],
    visible: true,
    imageUrl: "",
    imageAlt: "",
    imagePlacement: "right",
  })),
};
