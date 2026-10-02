"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { excludedPromotionPath, type Promotion } from "@/lib/promotion-schema";
import PromotionDialog from "./PromotionDialog";
// Document-lifetime state: survives internal navigation/remounts, resets on refresh.
let consumed = false;
let request: Promise<Promotion | null> | undefined;
let visit: string | undefined;
export default function PublicPromotion() {
  const path = usePathname();
  const entry = useRef("");
  const sent = useRef(new Set<string>());
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  useEffect(() => {
    if (!path || excludedPromotionPath(path) || consumed) return;
    const params = new URLSearchParams(window.location.search);
    if (
      ["publicationPreview", "designPreview", "galleryPreview"].some((k) =>
        params.has(k),
      )
    )
      return;
    if (!entry.current) entry.current = path;
    let alive = true;
    request ??= fetch("/api/promotion", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.promotion ?? null)
      .catch(() => null);
    request.then((value) => {
      if (alive && !consumed) {
        consumed = true;
        setPromotion(value);
      }
    });
    return () => {
      alive = false;
    };
  }, [path]);
  function send(event: "view" | "close" | "click") {
    if (
      !promotion?.statisticsEnabled ||
      sent.current.has(event) ||
      navigator.doNotTrack === "1" ||
      (navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl
    )
      return;
    sent.current.add(event);
    visit ??= crypto.randomUUID();
    const body = JSON.stringify({
      id: promotion.id,
      visit,
      event,
      path: entry.current,
    });
    try {
      if (
        navigator.sendBeacon?.(
          "/api/promotion/event",
          new Blob([body], { type: "application/json" }),
        )
      )
        return;
    } catch {
      /* Fall back to a keepalive request. */
    }
    void fetch("/api/promotion/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }
  if (!promotion || !path || excludedPromotionPath(path)) return null;
  return (
    <PromotionDialog
      key={promotion.id}
      promotion={promotion}
      onView={() => send("view")}
      onClick={() => send("click")}
      onDismiss={() => {
        if (sent.current.has("view") && !sent.current.has("click"))
          send("close");
        setPromotion(null);
      }}
    />
  );
}
