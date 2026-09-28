'use client';

import { Children, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ContentCarousel({ label, children }: { label: string; children: ReactNode }) {
  const items = Children.toArray(children);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function move(index: number) {
    const element = track.current;
    if (!element) return;
    const target = Math.max(0, Math.min(index, items.length - 1));
    const cards = element.querySelectorAll<HTMLElement>('[data-carousel-card]');
    const first = cards[0];
    const card = cards[target];
    if (!card || !first) return;
    element.scrollTo({
      left: card.offsetLeft - first.offsetLeft,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
    setActive(target);
  }

  function syncPosition() {
    const element = track.current;
    if (!element) return;
    const cards = [...element.querySelectorAll<HTMLElement>('[data-carousel-card]')];
    const first = cards[0];
    if (!first) return;
    if (element.scrollLeft >= element.scrollWidth - element.clientWidth - 2) { setActive(cards.length - 1); return; }
    let closest = 0;
    let distance = Infinity;
    for (let index = 0; index < cards.length; index++) {
      const gap = Math.abs(cards[index].offsetLeft - first.offsetLeft - element.scrollLeft);
      if (gap < distance) { closest = index; distance = gap; }
    }
    setActive(closest);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      move(active + (event.key === 'ArrowRight' ? 1 : -1));
    }
  }

  return <div className="min-w-0" aria-label={label}>
    <div ref={track} role="region" aria-roledescription="carousel" aria-label={label} tabIndex={0} onKeyDown={onKeyDown} onScroll={syncPosition}
      className="content-carousel flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain scroll-smooth py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:gap-6">
      {items.map((item, index) => <div data-carousel-card key={index} className="flex w-[min(82vw,320px)] shrink-0 snap-start sm:w-[320px] lg:w-[340px]">{item}</div>)}
    </div>
    {items.length > 1 && <div className="mt-5 flex items-center justify-between gap-3">
      <span className={`text-sm ${items.length <= 5 ? 'md:hidden' : ''}`} aria-live="polite">{active + 1} dari {items.length}</span>
      {items.length <= 5 && <div className="hidden items-center gap-1 md:flex" aria-label={`Posisi ${label}`}>
        {items.map((_, index) => <button key={index} type="button" onClick={() => move(index)} aria-label={`Lihat kartu ${index + 1} dari ${items.length}`} aria-current={active === index ? 'true' : undefined}
          className="grid h-11 w-11 place-items-center focus-visible:outline-2 focus-visible:outline-emerald-700"><span className={`block h-2 rounded-full transition-all ${active === index ? 'w-5 bg-[#e4c72f]' : 'w-2 bg-gray-400'}`} /></button>)}
      </div>}
      <div className="flex gap-2">
        <button type="button" onClick={() => move(active - 1)} disabled={active === 0} aria-label={`Kartu sebelumnya: ${label}`} className="grid h-11 w-11 place-items-center rounded-full border border-current/30 disabled:opacity-40"><ChevronLeft size={20} /></button>
        <button type="button" onClick={() => move(active + 1)} disabled={active === items.length - 1} aria-label={`Kartu berikutnya: ${label}`} className="grid h-11 w-11 place-items-center rounded-full border border-current/30 disabled:opacity-40"><ChevronRight size={20} /></button>
      </div>
    </div>}
  </div>;
}
