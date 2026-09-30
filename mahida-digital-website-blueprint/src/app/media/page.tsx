import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicMenu, getPublicPage } from '@/lib/cms';
import { getDesign } from '@/lib/design-store';
import DesignHero from '@/components/DesignHero';
import DesignSections from '@/components/DesignSections';
import { VisualItem } from '@/components/VisualMedia';
import RichContent from '@/components/RichContent';
export const dynamic = 'force-dynamic';
export default async function MediaPage() {
  const page = await getPublicPage('/media');
  if (!page) notFound();
  const menu =
    (await getPublicMenu()).find((i) => i.path === '/media')?.children || [];
  const visual = await getDesign('/media', 'media');
  const cards = [
    ['/media/kegiatan', 'card-kegiatan'],
    ['/media/video', 'card-video'],
    ['/media/galeri', 'card-galeri'],
  ];
  return (
    <div className="min-h-screen bg-cream">
      <DesignHero path="/media" className="px-5 py-20 md:py-28">
        <div className="mx-auto max-w-[1280px]">
          <h1 className="text-4xl font-black md:text-6xl">{page.title}</h1>
          {page.intro && (
            <p className="mt-5 max-w-2xl leading-8">{page.intro}</p>
          )}
        </div>
      </DesignHero>
      <div className="mx-auto max-w-[1280px] space-y-12 px-5 py-14">
        <div className="prose-article space-y-4">
          <RichContent content={page.body || ''} />
        </div>
        <nav aria-label="Jelajahi media" className="grid gap-5 md:grid-cols-3">
          {cards.map(([path, area]) => {
            const item = menu.find((i) => i.path === path);
            if (!item) return null;
            const clip = visual?.clips.find((c) => c.area === area);
            return (
              <Link
                key={path}
                href={path}
                className="group overflow-hidden border border-mahida-200 bg-white transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2"
              >
                {clip && <VisualItem clip={clip} />}
                <span className="flex min-h-16 items-center justify-between p-5 text-xl font-bold">
                  {item.label}
                  <span aria-hidden>↗</span>
                </span>
              </Link>
            );
          })}
        </nav>
        <DesignSections path="/media" />
      </div>
    </div>
  );
}
