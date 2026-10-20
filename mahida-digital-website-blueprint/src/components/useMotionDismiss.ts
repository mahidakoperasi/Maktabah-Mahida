"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export default function useMotionDismiss(onDismiss: () => void) {
  const callback = useRef(onDismiss);
  const timer = useRef<number | null>(null);
  const [closing, setClosing] = useState(false);
  useEffect(() => { callback.current = onDismiss; }, [onDismiss]);
  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);
  const dismiss = useCallback(() => {
    if (timer.current !== null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      callback.current();
      return;
    }
    setClosing(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setClosing(false);
      callback.current();
    }, 140);
  }, []);
  return { closing, dismiss };
}
