import { BookOpen, Users, MapPin, Award } from 'lucide-react';
import { isDesignPreview, getDesign } from '@/lib/design-store';
import RichContent from './RichContent';
import VisualGrid from './VisualMedia';
import { BODY_SECTION, defaultSectionLayout } from '@/lib/design-schema';
import { TextMediaBlock } from './DesignTextBlock';
export default async function DesignSections({ path }: { path: string }) {
  const [content, media] = await Promise.all([
    getDesign(path, 'content'),
    getDesign(path, 'media'),
  ]);
  const preview = await isDesignPreview(path);
  const sections =
    content?.sections.filter((s) => s.enabled && s.title && s.body.trim()) ||
    [];
  const icons = {
    book: BookOpen,
    people: Users,
    location: MapPin,
    award: Award,
  };
  const visibleIds = new Set([
    ...(path === '/' ? [] : [BODY_SECTION]),
    ...(content?.sections.map((s) => s.id) || []),
  ]);
  const unplaced =
    media?.clips.filter(
      (c) =>
        c.area === 'inline' &&
        (!c.afterSection || !visibleIds.has(c.afterSection)),
    ) || [];
  return (
    <div
      className={`space-y-10 ${preview ? 'outline outline-2 outline-dashed outline-emerald-600' : ''}`}
    >
      {preview && (
        <p className="text-xs font-bold">
          Area kliping: inline / gallery. Bagian teks dikunci di editor Kliping.
        </p>
      )}
      <VisualGrid clips={unplaced} />
      {sections.map((s) => {
        const Icon = s.icon === 'none' ? null : icons[s.icon];
        return (
          <section key={s.id} className="space-y-5" id={`section-${s.id}`}>
            <TextMediaBlock
              sectionId={s.id}
              clips={
                media?.clips.filter(
                  (c) => c.area === 'inline' && c.afterSection === s.id,
                ) ?? []
              }
              layout={
                media?.sectionLayouts?.find((v) => v.sectionId === s.id)
                  ?.layout ?? defaultSectionLayout(path, s.title)
              }
            >
              <h2 className="flex min-w-0 items-center gap-3 break-words text-2xl font-bold md:text-3xl">
                {Icon && <Icon aria-hidden size={24} />}
                <span className="min-w-0 break-words">{s.title}</span>
              </h2>
              <div className="prose-article space-y-4 break-words">
                <RichContent content={s.body} />
              </div>
            </TextMediaBlock>
          </section>
        );
      })}
      <VisualGrid
        clips={media?.clips.filter((c) => c.area === 'gallery') || []}
        carousel={path === '/tentang/pendaftaran'}
      />
    </div>
  );
}
