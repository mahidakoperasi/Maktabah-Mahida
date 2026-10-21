"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Animate explicit presentation elements only. Server-rendered content is always
// visible; an unavailable observer, disabled JS, or a failed animation hides nothing.
export default function PublicMotion() {
  const path = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    delete root.dataset.publicMotion;
    if (
      !path || path.startsWith("/admin") ||
      ["/masuk", "/daftar", "/kirim-karya"].includes(path) ||
      /^\/maktabah\/kitab\/[^/]+\/baca(?:\/|$)/.test(path)
    ) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const seen = new WeakSet<Element>();
    const active = new Map<Element, Animation>();
    let observer: IntersectionObserver | undefined;
    const cancel = () => {
      active.forEach((animation) => animation.cancel());
      active.clear();
    };
    const collect = (node: ParentNode) => {
      if (!observer || media.matches) return;
      const elements = Array.from(node.querySelectorAll<HTMLElement>("[data-motion]"));
      if (node instanceof HTMLElement && node.matches("[data-motion]")) elements.unshift(node);
      elements.forEach((element) => {
        if (!seen.has(element) && !element.closest(".library-reading, .prose-article, [data-protected-reading], form, dialog")) observer?.observe(element);
      });
    };
    const setup = () => {
      observer?.disconnect();
      observer = undefined;
      cancel();
      root.dataset.publicMotion = media.matches ? "reduce" : "on";
      if (media.matches || typeof window.IntersectionObserver !== "function" || typeof Element.prototype.animate !== "function") return;
      observer = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting || seen.has(target)) return;
          seen.add(target);
          observer?.unobserve(target);
          // Hash targets and keyboard focus must settle immediately.
          if (target.contains(document.activeElement) || (target.id && location.hash === `#${target.id}`)) return;
          const element = target as HTMLElement;
          const variant = element.dataset.motion ?? "reveal";
          const smallScreen = window.matchMedia("(max-width: 640px)").matches;
          // Stagger only a few cards; no animation is needed to make content visible.
          const rawDelay = Number(element.dataset.motionDelay ?? 0);
          const delay = Number.isFinite(rawDelay) ? Math.max(0, Math.min(180, rawDelay)) : 0;
          const distance = variant === "hero" ? 18 : variant === "card" ? 14 : variant === "banner" ? 8 : 10;
          const offset = smallScreen ? Math.min(10, distance) : distance;
          const fadeOnly = variant === "fade";
          const scale = variant === "hero" ? " scale(0.99)" : variant === "card" ? " scale(0.995)" : "";
          const animation = element.animate(
            [
              { opacity: fadeOnly ? 0.65 : 0.4, transform: fadeOnly ? "none" : `translateY(${offset}px)${scale}` },
              { opacity: 1, transform: "none" },
            ],
            {
              duration: variant === "hero" ? 520 : variant === "card" ? 440 : variant === "banner" ? 420 : 380,
              delay,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            },
          );
          active.set(target, animation);
          void animation.finished.then(() => active.delete(target), () => active.delete(target));
        });
      }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });
      collect(document);
    };
    const mutations = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node instanceof Element) collect(node);
      }));
    });
    const focus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      active.forEach((animation, element) => {
        if (element.contains(event.target as Node)) {
          animation.cancel();
          active.delete(element);
        }
      });
    };
    setup();
    mutations.observe(document.body, { childList: true, subtree: true });
    media.addEventListener("change", setup);
    document.addEventListener("focusin", focus);
    return () => {
      observer?.disconnect();
      mutations.disconnect();
      media.removeEventListener("change", setup);
      document.removeEventListener("focusin", focus);
      cancel();
      delete root.dataset.publicMotion;
    };
  }, [path]);
  return null;
}
