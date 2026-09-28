import Link from 'next/link';
import ArticleCover from './ArticleCover';

export default function SummaryCard({ href, title, excerpt, cover, label }: {
  href: string; title: string; excerpt?: string | null; cover?: string | null; label?: string;
}) {
  return <article className="min-w-0 overflow-hidden rounded-xl border border-mahida-200 bg-white shadow-sm">
    <Link href={href} className="block bg-mahida-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" aria-label={`Buka ${title}`}>
      <ArticleCover url={cover ?? null} />
    </Link>
    <div className="p-5 sm:p-6">
      {label && <p className="label mb-2">{label}</p>}
      <h2 className="break-words font-serif text-xl font-bold"><Link href={href} className="hover:text-emerald-forest">{title}</Link></h2>
      {excerpt && <p className="mt-3 line-clamp-3 text-sm leading-6 text-warm-gray-600">{excerpt}</p>}
    </div>
  </article>;
}
