"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import type { Footnote } from "@/lib/kitab-footnotes";
import KitabBlocks from "./KitabBlocks";
import ProtectedReadingClient from "./ProtectedReadingClient";
export type OpenFootnote = {
  note: Footnote;
  trigger: HTMLAnchorElement;
  top: number;
  left: number;
};
export default function KitabFootnoteDialog({
  open,
  onClose,
  fontSize,
  protectedContent,
  query,
}: {
  open: OpenFootnote | null;
  onClose: () => void;
  fontSize: number;
  protectedContent: boolean;
  query: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) {
      dialog.showModal();
      dialog
        .querySelector<HTMLButtonElement>("button")
        ?.focus({ preventScroll: true });
    } else if (!open && dialog?.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="kitab-note-dialog"
      aria-labelledby="kitab-note-title"
      style={
        {
          "--kitab-note-top": `clamp(16px, ${open?.top ?? 16}px, max(16px, calc(100dvh - 350px)))`,
          top: "var(--kitab-note-top)",
          left: `min(${open?.left ?? 16}px, max(16px, calc(100vw - 456px)))`,
          fontSize,
        } as CSSProperties
      }
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const bounds = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < bounds.left ||
            e.clientX > bounds.right ||
            e.clientY < bounds.top ||
            e.clientY > bounds.bottom
          )
            onClose();
        }
      }}
    >
      <div className="kitab-note-dialog-heading">
        <h2 id="kitab-note-title">Catatan kaki {open?.note.number}</h2>
        <button aria-label="Tutup catatan kaki" onClick={onClose}>
          ×
        </button>
      </div>
      {open && (
        <ProtectedReadingClient enabled={protectedContent}>
          <KitabBlocks
            blocks={open.note.blocks}
            idPrefix="popup-"
            query={query}
            footnoteFontSize={fontSize}
          />
        </ProtectedReadingClient>
      )}
      <button className="kitab-note-return" onClick={onClose}>
        Kembali membaca
      </button>
    </dialog>
  );
}
