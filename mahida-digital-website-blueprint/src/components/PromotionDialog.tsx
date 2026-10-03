"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { driveThumbnailUrl } from "@/lib/media-links";
import { promotionHref, type Promotion } from "@/lib/promotion-schema";
export default function PromotionDialog({
  promotion,
  preview = false,
  onDismiss,
  onView,
  onClick,
}: {
  promotion: Promotion;
  preview?: boolean;
  onDismiss: () => void;
  onView?: () => void;
  onClick?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const viewed = useRef(false);
  const callbacks = useRef({ onView, onDismiss });
  useEffect(() => {
    callbacks.current = { onView, onDismiss };
  }, [onView, onDismiss]);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = driveThumbnailUrl(promotion.posterUrl);
  useEffect(() => {
    const element = dialog.current;
    if (!element || !(preview || loaded) || (failed && !preview)) return;
    element.showModal();
    const body = element.ownerDocument.body;
    const previous = body.style.overflow;
    body.style.overflow = "hidden";
    if (loaded && !viewed.current) {
      viewed.current = true;
      callbacks.current.onView?.();
    }
    return () => {
      element.close();
      body.style.overflow = previous;
    };
  }, [loaded, failed, preview]);
  const href = promotionHref(promotion.buttonUrl);
  const click = () => {
    if (preview) return;
    onClick?.();
    onDismiss();
  };
  return (
    <dialog
      ref={dialog}
      aria-labelledby="promotion-title"
      className="promotion-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
    >
      <div className="relative">
        <button
          type="button"
          aria-label="Tutup promosi"
          onClick={onDismiss}
          className="absolute right-3 top-3 z-10 rounded-full border border-mahida-200 bg-white p-2 text-charcoal shadow-sm focus-visible:outline-2 focus-visible:outline-emerald-forest"
        >
          <X size={20} />
        </button>
        <div className="bg-emerald-forest px-6 pb-5 pt-6 pr-16 text-white">
          <p className="mb-2 text-xs uppercase tracking-widest">
            {preview ? "Pratinjau Promosi" : "Informasi Mahida"}
          </p>
          <h2 id="promotion-title" className="font-serif text-2xl font-bold">
            {promotion.title || "Judul promosi"}
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          {src && !failed ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={src}
              alt={promotion.posterAlt || promotion.title || "Poster promosi"}
              className="mx-auto max-h-[58svh] w-full object-contain"
              onLoad={() => setLoaded(true)}
              onError={() => {
                setFailed(true);
                if (!preview) onDismiss();
              }}
            />
          ) : (
            <p
              role="alert"
              className="py-8 text-center text-sm text-warm-gray-600"
            >
              Poster belum tersedia atau tidak dapat dibuka. Periksa akses
              Google Drive.
            </p>
          )}
          {promotion.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-warm-gray-600">
              {promotion.description}
            </p>
          )}
          {preview ? (
            <button type="button" className="btn-primary mt-5 w-full" disabled>
              {promotion.buttonLabel || "Daftar Sekarang"}
            </button>
          ) : (
            href &&
            (href.startsWith("/") ? (
              <Link
                href={href}
                onClick={click}
                className="btn-primary mt-5 w-full"
              >
                {promotion.buttonLabel}
              </Link>
            ) : (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={click}
                className="btn-primary mt-5 w-full"
              >
                {promotion.buttonLabel}
              </a>
            ))
          )}
          {preview && (
            <p className="mt-3 break-all text-xs text-warm-gray-500">
              Tujuan tombol: {promotion.buttonUrl || "Belum diisi"}. Pratinjau
              tidak menghitung statistik.
            </p>
          )}
        </div>
      </div>
    </dialog>
  );
}
