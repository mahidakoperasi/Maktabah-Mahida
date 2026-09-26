import Link from 'next/link';
import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { products } from '@/db/schema';
import { getPublicMenu, getPublicPage, paragraphs } from '@/lib/cms';
import { rupiah } from '@/lib/rupiah';
import ArticleCover from '@/components/ArticleCover';

export const dynamic = 'force-dynamic';
export default async function KoperasiPage() {
  const page = await getPublicPage('/koperasi');
  if (!page) notFound();
  const sections = (await getPublicMenu()).find((item) => item.path === '/koperasi')?.children ?? [];
  const rows = await db.select({ id: products.id, name: products.name, slug: products.slug, description: products.description, price: products.price, productType: products.productType, imageUrl: products.imageUrl })
    .from(products).where(eq(products.status,'published')).orderBy(desc(products.createdAt));
  return <div className="min-h-screen bg-cream"><header className="bg-emerald-forest py-14 text-white"><div className="mx-auto max-w-5xl px-4"><h1 className="display-md text-white">{page.title}</h1>{page.intro && <p className="mt-4 text-white/80">{page.intro}</p>}</div></header><div className="mx-auto max-w-5xl px-4 py-12"><nav className="mb-8 flex flex-wrap gap-3">{sections.map((item) => <Link key={item.id} href={item.path} className="inline-flex min-h-11 items-center border bg-white px-4 py-2 text-sm">{item.label}</Link>)}</nav>{page.body && <div className="mb-8 space-y-4 text-warm-gray-600">{paragraphs(page.body).map((part, index) => <p key={index}>{part}</p>)}</div>}{rows.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{rows.map((item) => <Link key={item.id} href={`/koperasi/${item.productType === 'ebook' ? 'ebook' : 'buku'}/${item.slug}`} className="group flex min-w-0 flex-col overflow-hidden border bg-white"><ArticleCover url={item.imageUrl} /><div className="flex flex-1 flex-col p-5"><p className="label">{item.productType === 'ebook' ? 'E-Book' : 'Buku Fisik'}</p><h2 className="mt-2 font-serif text-xl font-bold">{item.name}</h2>{item.description && <p className="mt-3 line-clamp-3 text-sm text-warm-gray-600">{item.description}</p>}<p className="mt-auto pt-4 font-semibold text-emerald-forest">{rupiah(item.price)}</p></div></Link>)}</div> : <div className="empty-state">Belum ada produk terbit. Katalog akan tampil setelah admin menerbitkan produk.</div>}</div></div>;
}
