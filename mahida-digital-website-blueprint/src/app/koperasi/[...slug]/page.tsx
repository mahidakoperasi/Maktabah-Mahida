import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { products } from '@/db/schema';
import { ebookCheckoutReady, getCommerceSettings } from '@/lib/commerce';
import { rupiah } from '@/lib/rupiah';
import { getPublicPage } from '@/lib/cms';
import ProductPurchase from '@/components/ProductPurchase';
import DrivePreview from '@/components/DrivePreview';
import ArticleCover from '@/components/ArticleCover';
import CmsPage from '@/components/CmsPage';

export const dynamic = 'force-dynamic';
export default async function KoperasiSection({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  if (!['buku','ebook'].includes(slug[0])) return <CmsPage path={`/koperasi/${slug.join('/')}`} />;
  if (slug.length > 2) notFound();
  const type = slug[0] === 'ebook' ? 'ebook' : 'physical_book';
  const path = `/koperasi/${slug[0]}`;
  const page = await getPublicPage(path);
  if (!page) notFound();
  if (slug.length === 1) {
    const rows = await db.select({ id: products.id, slug: products.slug, name: products.name, description: products.description, price: products.price, imageUrl: products.imageUrl })
      .from(products).where(and(eq(products.productType,type),eq(products.status,'published'))).orderBy(desc(products.createdAt));
    return <div className="min-h-screen bg-cream"><header className="bg-emerald-forest py-14 text-white"><div className="mx-auto max-w-5xl px-4"><h1 className="display-md text-white">{page.title}</h1>{page.intro && <p className="mt-3 text-white/80">{page.intro}</p>}</div></header><div className="mx-auto grid max-w-5xl gap-5 px-4 py-12 sm:grid-cols-2">{rows.length ? rows.map((item) => <Link key={item.id} href={`${path}/${item.slug}`} className="group flex min-w-0 flex-col overflow-hidden border bg-white"><ArticleCover url={item.imageUrl} /><div className="flex flex-1 flex-col p-5"><h2 className="font-serif text-xl font-bold">{item.name}</h2>{item.description && <p className="mt-3 line-clamp-3 text-sm text-warm-gray-600">{item.description}</p>}<p className="mt-auto pt-5 font-semibold text-emerald-forest">{rupiah(item.price)} →</p></div></Link>) : <p className="empty-state">Belum ada produk terbit pada kategori ini.</p>}</div></div>;
  }
  const [product] = await db.select({ id: products.id, name: products.name, description: products.description, price: products.price, productType: products.productType, inStock: products.inStock, imageUrl: products.imageUrl })
    .from(products).where(and(eq(products.slug,slug[1]),eq(products.productType,type),eq(products.status,'published'))).limit(1);
  if (!product) notFound();
  const settings = await getCommerceSettings();
  return <div className="min-h-screen bg-cream"><header className="bg-emerald-forest py-14 text-white"><div className="mx-auto max-w-4xl px-4"><Link href={path} className="text-sm text-white/75">← Semua {page.title}</Link><h1 className="display-md mt-5 text-white">{product.name}</h1></div></header><div className="mx-auto max-w-4xl space-y-7 px-4 py-12">{product.imageUrl && <DrivePreview url={product.imageUrl} title={`Sampul ${product.name}`} />}<p className="text-lg leading-8 text-warm-gray-600">{product.description}</p><p className="font-serif text-3xl font-bold text-emerald-forest">{rupiah(product.price)}</p><ProductPurchase id={product.id} name={product.name} type={product.productType} price={product.price} inStock={product.inStock} whatsappNumber={settings.whatsappNumber} ebookReady={ebookCheckoutReady(settings)} /></div></div>;
}
