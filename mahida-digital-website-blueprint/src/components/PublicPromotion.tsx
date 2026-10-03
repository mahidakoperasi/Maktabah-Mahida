"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { excludedPromotionPath, type Promotion } from "@/lib/promotion-schema";
import PromotionDialog from "./PromotionDialog";
import {
  editingPublicForm,
  protectedPublicFormPresent,
} from "@/lib/promotion-form-guard";
// Document-lifetime state: survives internal navigation/remounts, resets on refresh.
let consumed = false;
let request: Promise<Promotion | null> | undefined;
let visit: string | undefined;
export default function PublicPromotion() {
  const path = usePathname();
  const entry = useRef("");
  const readyAt = useRef(0);
  const sent = useRef(new Set<string>());
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  useEffect(() => {
    if (!path || excludedPromotionPath(path)) return;
    const suppress = () => {
      consumed = true;
      setPromotion(null);
    };
    const interact = (event: Event) => {
      if (editingPublicForm(event.target)) suppress();
    };
    const inspect = () => {
      if (protectedPublicFormPresent()) suppress();
    };
    for (const event of ["focusin", "input", "change"])
      document.addEventListener(event, interact, true);
    const observer = new MutationObserver(inspect);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "src",
        "data-registration-form",
        "data-promotion-exclude",
      ],
    });
    // Covers autofocus, restored values and forms inserted during hydration.
    queueMicrotask(inspect);
    return () => {
      for (const event of ["focusin", "input", "change"])
        document.removeEventListener(event, interact, true);
      observer.disconnect();
    };
  }, [path]);
  useEffect(() => {
    if (!path || excludedPromotionPath(path) || consumed) return;
    const params = new URLSearchParams(window.location.search);
    if (
      [
        "publicationPreview",
        "designPreview",
        "galleryPreview",
        "maktabahPreview",
      ].some((k) => params.has(k))
    )
      return;
    if (!entry.current) entry.current = path;
    readyAt.current ||= Date.now() + 1000;
    let alive = true;
    let value: Promotion | null = null;
    let fetched = false;
    let delayed = false;
    function show() {
      if (!alive || consumed || !fetched || !delayed) return;
      consumed = true;
      if (!protectedPublicFormPresent()) setPromotion(value);
    }
    const timer = window.setTimeout(
      () => {
        delayed = true;
        show();
      },
      Math.max(0, readyAt.current - Date.now()),
    );
    request ??= fetch("/api/promotion", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.promotion ?? null)
      .catch(() => null);
    request.then((result) => {
      value = result;
      fetched = true;
      show();
    });
    return () => {
      alive = false;
      window.clearTimeout(timer);
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
