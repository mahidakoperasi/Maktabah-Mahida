'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PublicMenuItem } from '@/lib/cms';

export default function SectionNavigationClient({ items }: { items: PublicMenuItem[] }) {
  const pathname = usePathname();
  const section = items.find((item) => item.path !== '/' &&
    (pathname === item.path || pathname.startsWith(`${item.path}/`)));
  if (!section?.children.length) return null;

  const current = section.children.find((item) =>
    pathname === item.path || pathname.startsWith(`${item.path}/`))?.path ?? section.path;

  return (
    <nav aria-label={`Submenu ${section.label}`} className="relative z-10 border-b border-mahida-200 bg-white px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
        {[{ id: section.id, label: 'Ringkasan', path: section.path }, ...section.children].map((item) => {
          const active = item.path === current;
          return <Link key={item.id} href={item.path} aria-current={active ? 'page' : undefined}
            className={`inline-flex min-h-11 items-center rounded px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-forest ${active ? 'bg-emerald-forest text-white' : 'bg-warm-gray-100 text-warm-gray-600 hover:bg-mahida-100 hover:text-emerald-forest'}`}>
            {item.label}
          </Link>;
        })}
      </div>
    </nav>
  );
}
