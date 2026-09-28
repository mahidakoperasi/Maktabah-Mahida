import Link from 'next/link';

export default function AuthorByline({ author, authorClass, publishedAt, onDark = false }: {
  author?: { name: string; slug: string } | null;
  authorClass?: string | null;
  publishedAt?: Date | null;
  onDark?: boolean;
}) {
  if (!author && !publishedAt) return null;
  const formatted = publishedAt ? new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(publishedAt).replace(' pukul ', ', ') + ' WIB' : null;
  return <div className={`mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm ${onDark ? 'text-white/80' : 'text-warm-gray-600'}`}>
    {author && <span>Oleh: <Link href={`/penulis/${author.slug}`} className={`font-semibold underline-offset-4 hover:underline focus-visible:underline ${onDark ? 'text-white' : 'text-emerald-700'}`}>{author.name}</Link>{authorClass ? `, ${authorClass}` : ''}</span>}
    {author && formatted && <span aria-hidden="true">•</span>}
    {formatted && <time dateTime={publishedAt!.toISOString()}>{formatted}</time>}
  </div>;
}
