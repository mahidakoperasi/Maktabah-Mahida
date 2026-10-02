import type { ReactNode } from 'react';
import { getDesign } from '@/lib/design-store';
import {
  BODY_SECTION,
  defaultSectionLayout,
  type Clip,
  type SectionLayout,
} from '@/lib/design-schema';
import VisualGrid from './VisualMedia';

export function TextMediaBlock({
  sectionId,
  layout,
  clips,
  children,
}: {
  sectionId: string;
  layout: SectionLayout;
  clips: Clip[];
  children: ReactNode;
}) {
  const paired = clips.length > 0 && layout !== 'stacked';
  return (
    <div
      data-text-media-section={sectionId}
      data-text-media-layout={paired ? layout : 'stacked'}
      className={
        paired
          ? `grid min-w-0 items-start gap-6 md:gap-10 ${layout === 'text-right' ? 'md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]' : 'md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]'}`
          : 'min-w-0 space-y-5'
      }
    >
      <div
        data-text-column
        className={`min-w-0 space-y-5 ${paired && layout === 'text-right' ? 'md:order-2' : ''}`}
      >
        {children}
      </div>
      {clips.length > 0 && (
        <div
          data-media-column
          className={`min-w-0 ${paired && layout === 'text-right' ? 'md:order-1' : ''}`}
        >
          <VisualGrid clips={clips} besideText={paired} />
        </div>
      )}
    </div>
  );
}
export default async function DesignTextBlock({
  path,
  children,
  hasText = true,
}: {
  path: string;
  children?: ReactNode;
  hasText?: boolean;
}) {
  const media = await getDesign(path, 'media');
  const clips =
    media?.clips.filter(
      (c) => c.area === 'inline' && c.afterSection === BODY_SECTION,
    ) ?? [];
  if (!clips.length) return <>{children}</>;
  const layout = hasText
    ? (media?.sectionLayouts?.find((s) => s.sectionId === BODY_SECTION)
        ?.layout ?? defaultSectionLayout(path, ''))
    : 'stacked';
  return (
    <TextMediaBlock sectionId={BODY_SECTION} layout={layout} clips={clips}>
      {children}
    </TextMediaBlock>
  );
}
