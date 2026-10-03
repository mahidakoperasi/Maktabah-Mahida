"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
const editable =
  'input,textarea,select,button,a,[contenteditable="true"],[role="textbox"],[data-reading-control]';
const textInput =
  'input,textarea,select,[contenteditable="true"],[role="textbox"]';
export default function ProtectedReadingClient({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const protectedArea = enabled && !/^\/admin(\/|$)/.test(pathname ?? "");
  useEffect(() => {
    if (!protectedArea) return;
    function copy(event: ClipboardEvent) {
      if (document.activeElement?.closest(textInput)) return;
      const selection = window.getSelection();
      if (!root.current || !selection?.rangeCount) return;
      for (let i = 0; i < selection.rangeCount; i++) {
        if (selection.getRangeAt(i).intersectsNode(root.current)) {
          event.preventDefault();
          break;
        }
      }
    }
    document.addEventListener("copy", copy);
    document.addEventListener("cut", copy);
    return () => {
      document.removeEventListener("copy", copy);
      document.removeEventListener("cut", copy);
    };
  }, [protectedArea]);
  return (
    <div
      ref={root}
      className={protectedArea ? "protected-reading" : undefined}
      data-protected-reading={protectedArea || undefined}
      onCopy={(event) => {
        if (protectedArea && !(event.target as Element).closest(editable))
          event.preventDefault();
      }}
      onCut={(event) => {
        if (protectedArea && !(event.target as Element).closest(editable))
          event.preventDefault();
      }}
      onDragStart={(event) => {
        if (protectedArea && !(event.target as Element).closest(editable))
          event.preventDefault();
      }}
      onContextMenu={(event) => {
        if (protectedArea && !(event.target as Element).closest(editable))
          event.preventDefault();
      }}
    >
      {children}
    </div>
  );
}
