import type { ReactNode } from 'react';
import Link from 'next/link';
import EditorialImage from './EditorialImage';
import { getEditorialContent } from '@/lib/editorial-content';
import { designPath } from '@/lib/design-schema';
import { getDesign } from '@/lib/design-store';
import DesignHero from './DesignHero';
import DesignSections from './DesignSections';
import RichContent from './RichContent';
import LegacyGenericPageTemplate from './LegacyGenericPageTemplate';
import DesignTextBlock from './DesignTextBlock';
export type GenericPageTemplateProps = {
  title: string;
  intro?: string | null;
  paragraphs?: string[];
  section?: string;
  children?: ReactNode;
  path?: string;
  headerActions?: ReactNode;
};
export default async function GenericPageTemplate({
  title,
  intro,
  paragraphs = [],
  section,
  children,
  path,
  headerActions,
}: GenericPageTemplateProps) {
  const scoped = Boolean(path && designPath(path));
  if (!scoped)
    return (
      <LegacyGenericPageTemplate
        title={title}
        intro={intro}
        paragraphs={paragraphs}
        section={section}
        path={path}
      >
        {children}
      </LegacyGenericPageTemplate>
    );
  const visual = path ? await getEditorialContent(path) : null;
  const media = scoped ? await getDesign(path!, 'media') : null;
  const images = visual?.images.filter(Boolean) || [];
  const header = (
    <div className="mx-auto max-w-[1280px]">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm">
        <Link href="/">Beranda</Link> / <span aria-current="page">{title}</span>
      </nav>
      {(visual?.sectionLabel || section) && (
        <p className="text-xs font-bold uppercase tracking-[0.2em]">
          {visual?.sectionLabel || section}
        </p>
      )}
      <h1 className="mt-3 max-w-5xl text-4xl font-black leading-tight tracking-tight md:text-6xl lg:text-7xl">
        {title}
      </h1>
      {intro && (
        <p className="mt-7 max-w-[720px] text-lg leading-8 md:text-xl">
          {intro}
        </p>
      )}
      {headerActions && (
        <div className="mt-7 flex flex-wrap gap-3">{headerActions}</div>
      )}
    </div>
  );
  return (
    <article className="min-h-screen bg-[#fffef9] text-[#143d2a]">
      {scoped ? (
        <DesignHero
          path={path!}
          className="px-5 py-14 md:px-8 md:py-20 lg:px-12"
        >
          {header}
        </DesignHero>
      ) : (
        <header className="border-b border-mahida-200 px-5 py-14 md:px-8 md:py-20 lg:px-12">
          {header}
        </header>
      )}
      <div className="mx-auto max-w-[1280px] space-y-10 px-5 py-14 md:px-8 lg:px-12">
        <DesignTextBlock path={path!} hasText={Boolean(paragraphs.length)}>
          <div className="prose-article max-w-3xl space-y-7 break-words text-base leading-8 text-warm-gray-700 md:text-lg">
            {scoped ? (
              <RichContent content={paragraphs.join('\n\n')} />
            ) : (
              paragraphs.map((p, i) => (
                <p key={i} dir="auto">
                  {p}
                </p>
              ))
            )}
          </div>
        </DesignTextBlock>
        {scoped && <DesignSections path={path!} />}
        {(!scoped || !media) && images.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((url, i) => (
              <EditorialImage
                hideFallback
                key={i}
                url={url}
                label={`Foto ${title} ${i + 1}`}
                className="aspect-[4/3] w-full"
              />
            ))}
          </div>
        )}
        {children}
      </div>
    </article>
  );
}
