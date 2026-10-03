import { z } from "zod";
import { driveIdFromUrl } from "./media-links";

export const PROMOTION_KEY = "content_promotion";
export const promotionSchema = z
  .object({
    id: z.string().uuid(),
    // Defaults keep campaigns saved before these fields were added readable.
    name: z.string().trim().max(160).default(""),
    title: z.string().trim().max(160),
    posterAlt: z.string().trim().max(500).default(""),
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
export function readPromotionSettings(
  value: Record<string, unknown>,
): PromotionSettings {
  const read = (raw: unknown, details: unknown) => {
    if (!raw || typeof raw !== "object") return null;
    const extra =
      details && typeof details === "object"
        ? (details as Record<string, unknown>)
        : {};
    const stored = raw as Record<string, unknown>;
    return (
      promotionSchema.safeParse({
        ...stored,
        name: extra.name ?? stored.name,
        posterAlt: extra.posterAlt ?? stored.posterAlt,
      }).data ?? null
    );
  };
  return {
    protectionEnabled: value.protectionEnabled !== false,
    draft: read(value.draft, value.draftDetails),
    published: read(value.published, value.publishedDetails),
  };
}
export function storedPromotionSettings(value: PromotionSettings) {
  const split = (promotion: Promotion | null) => {
    if (!promotion) return { campaign: null, details: null };
    const { name, posterAlt, ...campaign } = promotion;
    return { campaign, details: { name, posterAlt } };
  };
  const draft = split(value.draft),
    published = split(value.published);
  // The deployed 76ef2e1 parser is strict on campaign fields. Keeping additions
  // beside the campaigns lets that image still display promotions after rollback.
  return {
    protectionEnabled: value.protectionEnabled,
    draft: draft.campaign,
    published: published.campaign,
    draftDetails: draft.details,
    publishedDetails: published.details,
  };
}
export function emptyPromotion(id: string): Promotion {
  return {
    id,
    name: "",
    title: "",
    posterAlt: "",
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
