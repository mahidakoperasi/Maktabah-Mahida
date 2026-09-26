import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicMenu, getPublicPage, paragraphs } from '@/lib/cms';

export const dynamic = 'force-dynamic';
export default async function MediaPage() {
  const page = await getPublicPage('/media');
  if (!page) notFound();
  const sections = (await getPublicMenu()).find((item) => item.path === '/media')?.children ?? [];
  return <div className="min-h-screen bg-cream"><header className="bg-emerald-forest py-14 text-white"><div className="mx-auto max-w-5xl px-4"><h1 className="display-md text-white">{page.title}</h1>{page.intro && <p className="mt-3 text-white/80">{page.intro}</p>}</div></header><div className="mx-auto max-w-5xl px-4 pt-10">{page.body && <div className="space-y-4 text-warm-gray-600">{paragraphs(page.body).map((part, index) => <p key={index}>{part}</p>)}</div>}</div><nav aria-label="Jelajahi media" className="mx-auto grid max-w-5xl gap-5 px-4 py-12 sm:grid-cols-2">{sections.length ? sections.map((item) => <Link key={item.id} href={item.path} className="border border-mahida-200 bg-white p-6 font-serif text-xl font-bold hover:text-emerald-forest">{item.label} →</Link>) : <p className="border bg-white p-6">Belum ada halaman media yang ditampilkan.</p>}</nav></div>;
}
