'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { validAnalyticsEvent } from '@/lib/analytics-schema';
export default function PublicAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    if (
      !pathname ||
      /^\/(admin|api|masuk|daftar)(\/|$)/.test(pathname) ||
      navigator.doNotTrack === '1' ||
      (navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl
    )
      return;
    const params = new URLSearchParams(window.location.search);
    if (
      ['publicationPreview', 'designPreview', 'galleryPreview', 'maktabahPreview'].some((k) =>
        params.has(k),
      )
    )
      return;
    function send(event: string) {
      if (!validAnalyticsEvent(event)) return;
      const body = JSON.stringify({ path: pathname, event });
      try {
        if (
          navigator.sendBeacon?.(
            '/api/analytics',
            new Blob([body], { type: 'application/json' }),
          )
        )
          return;
        void fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      } catch {
        /* Statistics never interrupt navigation or a form. */
      }
    }
    // Defer until a visible page is mounted; cleanup avoids Strict Mode duplicates.
    const timer = setTimeout(() => {
      if (document.visibilityState === 'visible') send('pageview');
    }, 150);
    const click = (event: MouseEvent) => {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>('a,button')
          : null;
      if (!target) return;
      let action = target.dataset.analyticsAction;
      if (!action && target instanceof HTMLAnchorElement) {
        const url = new URL(target.href);
        if (['wa.me', 'api.whatsapp.com'].includes(url.hostname))
          action = 'whatsapp';
        else if (
          [
            'youtube.com',
            'www.youtube.com',
            'youtu.be',
            'm.youtube.com',
          ].includes(url.hostname)
        )
          action = 'youtube';
        else if (
          url.origin === location.origin &&
          url.pathname === '/tentang/pendaftaran'
        )
          action = 'admissions';
      }
      if (action) send(action);
    };
    document.addEventListener('click', click);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', click);
    };
  }, [pathname]);
  return null;
}
