"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Promotion } from "@/lib/promotion-schema";
import PromotionDialog from "../PromotionDialog";

// A fixed document, with user content rendered by React rather than interpolated HTML.
const frameDocument =
  '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#faf9f5"><main style="padding:24px;color:#476052">Halaman publik Mahida</main></body></html>';

export default function PromotionPreview({
  promotion,
  onDismiss,
}: {
  promotion: Promotion;
  onDismiss: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"mobile" | "desktop">("mobile");
  const [frame, setFrame] = useState<Document | null>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const width = mode === "mobile" ? 390 : 1280;
  const height = mode === "mobile" ? 844 : 800;
  const scale = availableWidth ? Math.min(1, availableWidth / width) : 1;

  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const observer = new ResizeObserver((entries) =>
      setAvailableWidth(entries[0].contentRect.width),
    );
    observer.observe(stage.current!);
    return () => {
      observer.disconnect();
      element.close();
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className="promotion-preview-dialog"
      aria-labelledby="promotion-preview-title"
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-mahida-200 p-4">
        <div>
          <h2 id="promotion-preview-title" className="font-semibold">
            Pratinjau promosi
          </h2>
          <p className="text-xs text-warm-gray-600">
            {promotion.name || promotion.title || "Draf promosi"}
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={onDismiss}
        >
          Tutup pratinjau
        </button>
      </header>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2" aria-label="Ukuran pratinjau">
          <button
            type="button"
            className={mode === "mobile" ? "btn-primary" : "btn-secondary"}
            aria-pressed={mode === "mobile"}
            onClick={() => setMode("mobile")}
          >
            HP
          </button>
          <button
            type="button"
            className={mode === "desktop" ? "btn-primary" : "btn-secondary"}
            aria-pressed={mode === "desktop"}
            onClick={() => setMode("desktop")}
          >
            Desktop
          </button>
        </div>
        <p role="status" className="text-xs text-warm-gray-600">
          {width} × {height} px
          {scale < 1 ? " — diperkecil agar muat di layar" : ""}. Tombol tujuan
          dinonaktifkan; statistik tidak dicatat.
        </p>
        <div
          ref={stage}
          className="w-full overflow-hidden rounded border border-mahida-200 bg-warm-gray-100"
        >
          <div
            className="relative mx-auto"
            style={{ width: width * scale, height: height * scale }}
          >
            <iframe
              title="Layar pratinjau promosi"
              srcDoc={frameDocument}
              style={{
                width,
                height,
                maxWidth: "none",
                display: "block",
                border: 0,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
              onLoad={(event) => {
                const doc = event.currentTarget.contentDocument;
                if (!doc) return;
                // The same stylesheet and dialog run inside the selected viewport.
                for (const element of document.querySelectorAll(
                  'link[rel="stylesheet"],style',
                ))
                  doc.head.append(element.cloneNode(true));
                setFrame(doc);
              }}
            />
          </div>
        </div>
      </div>
      {frame &&
        createPortal(
          <PromotionDialog
            key={promotion.id}
            promotion={promotion}
            preview
            onDismiss={onDismiss}
          />,
          frame.body,
        )}
    </dialog>
  );
}
