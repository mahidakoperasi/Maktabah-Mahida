"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { driveThumbnailUrl } from "@/lib/media-links";
import { promotionHref, type Promotion } from "@/lib/promotion-schema";
import useMotionDismiss from "./useMotionDismiss";
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
  const { closing, dismiss } = useMotionDismiss(onDismiss);
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
    dismiss();
  };
  return (
    <dialog
      ref={dialog}
      aria-labelledby="promotion-title"
      className="promotion-dialog"
      data-closing={closing}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
    >
      <div className="promotion-layout">
        <button
          type="button"
          aria-label="Tutup promosi"
          onClick={dismiss}
          className="promotion-close"
        >
          <X size={20} />
        </button>
        <div className="promotion-poster" aria-label="Poster informasi promosi">
          {src && !failed ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={src}
              alt={promotion.posterAlt || promotion.title || "Poster promosi"}
              className="promotion-poster-image"
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
        </div>
        <div className="promotion-content">
          <div className="promotion-copy">
            <p className="promotion-eyebrow">
              {preview ? "Pratinjau Promosi" : "Pengumuman Mahida"}
            </p>
            <h2 id="promotion-title" className="promotion-title">
              {promotion.title || "Judul promosi"}
            </h2>
          {promotion.description && (
            <p className="promotion-description">
              {promotion.description}
            </p>
          )}
          {preview && (
            <p className="mt-3 break-all text-xs text-warm-gray-500">
              Tujuan tombol: {promotion.buttonUrl || "Belum diisi"}. Pratinjau
              tidak menghitung statistik.
            </p>
          )}
          </div>
          <div className="promotion-actions">
          <p className="promotion-action-hint">Informasi resmi dari Mahida</p>
          {preview ? (
            <button type="button" className="btn-primary w-full" disabled>
              {promotion.buttonLabel || "Daftar Sekarang"}
            </button>
          ) : (
            href &&
            (href.startsWith("/") ? (
              <Link
                href={href}
                onClick={click}
                className="btn-primary w-full"
              >
                {promotion.buttonLabel}
              </Link>
            ) : (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={click}
                className="btn-primary w-full"
              >
                {promotion.buttonLabel}
              </a>
            ))
          )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
