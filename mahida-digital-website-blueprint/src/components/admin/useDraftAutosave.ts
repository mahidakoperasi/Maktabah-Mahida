'use client';
import { useEffect, useRef } from 'react';
// The caller owns revision/CAS and blocks fields during a request. Invalid
// intermediate input stays local; conflicts stop retries until explicitly reloaded.
export default function useDraftAutosave(
  dirty: boolean,
  blocked: boolean,
  valid: boolean,
  save: () => Promise<void>,
) {
  const latest = useRef(save);
  useEffect(() => {
    latest.current = save;
  });
  useEffect(() => {
    if (!dirty || blocked || !valid) return;
    const timer = window.setTimeout(() => {
      void latest.current();
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [dirty, blocked, valid, save]);
}
