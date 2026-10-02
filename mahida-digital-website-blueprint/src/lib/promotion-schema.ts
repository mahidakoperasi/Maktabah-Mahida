import { z } from "zod";
import { driveIdFromUrl } from "./media-links";

export const PROMOTION_KEY = "content_promotion";
export const promotionSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().trim().max(160),
    description: z.string().trim().max(600),
    posterUrl: z
      .string()
      .trim()
      .max(2000)
      .refine(
        (v) => !v || Boolean(driveIdFromUrl(v)),
        "Gunakan tautan berkas gambar Google Drive.",
      ),
    buttonLabel: z.string().trim().max(80),
    buttonUrl: z
      .string()
      .trim()
      .max(2000)
      .refine(
        (v) => !v || promotionHref(v) !== null,
        "Gunakan alamat internal publik atau HTTPS.",
      ),
    startsAt: z.string().datetime({ offset: true }).nullable(),
    endsAt: z.string().datetime({ offset: true }).nullable(),
    enabled: z.boolean(),
    statisticsEnabled: z.boolean(),
  })
  .strict()
  .refine(
    (v) =>
      !v.startsAt || !v.endsAt || Date.parse(v.endsAt) > Date.parse(v.startsAt),
    "Waktu selesai harus setelah waktu mulai.",
  );
export type Promotion = z.infer<typeof promotionSchema>;
export type PromotionSettings = {
  protectionEnabled: boolean;
  draft: Promotion | null;
  published: Promotion | null;
};
export function emptyPromotion(id: string): Promotion {
  return {
    id,
    title: "",
    description: "",
    posterUrl: "",
    buttonLabel: "Daftar Sekarang",
    buttonUrl: "/tentang/pendaftaran",
    startsAt: null,
    endsAt: null,
    enabled: false,
    statisticsEnabled: true,
  };
}
export function promotionHref(value: string) {
  if (/^\/(?!\/)[^\\\s]*$/.test(value)) {
    try {
      const url = new URL(value, "https://mahida.my.id");
      if (
        /^\/(admin|api|masuk|daftar)(\/|$)/.test(
          decodeURIComponent(url.pathname),
        ) ||
        /[\\\u0000-\u001f]/.test(decodeURIComponent(value))
      )
        return null;
      return value;
    } catch {
      return null;
    }
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function activePromotion(value: Promotion | null, now = Date.now()) {
  return value?.enabled &&
    value.title &&
    value.posterUrl &&
    value.buttonLabel &&
    promotionHref(value.buttonUrl) &&
    (!value.startsAt || Date.parse(value.startsAt) <= now) &&
    (!value.endsAt || now < Date.parse(value.endsAt))
    ? value
    : null;
}
export function excludedPromotionPath(path: string) {
  return /^\/(admin|api|masuk|daftar)(\/|$)/.test(path);
}
