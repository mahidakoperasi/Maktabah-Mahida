import type { ReactNode } from 'react';
import YouTubeArticleBlock from './YouTubeArticleBlock';
import { driveThumbnailUrl, youtubeIdFromUrl } from '@/lib/media-links';

const blocks = /(\[\[(?:image|youtube):[^\]]+\]\])/gi;
const imageMarker = /^\[\[image:(https:\/\/[^\]|\s]+)(?:\|([^\]]{0,200}))?\]\]$/i;
const youtubeMarker = /^\[\[youtube:(https:\/\/[^\]|\s]+)(?:\|([^\]]{0,200}))?\]\]$/i;

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\+\+[^+\n]+\+\+)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith('++') && part.endsWith('++')) return <u key={index}>{part.slice(2, -2)}</u>;
    return part;
  });
}

export default function RichContent({ content }: { content: string }) {
  let key = 0;
  const nodes: ReactNode[] = [];
  content.split(blocks).forEach((part) => {
    const image = imageMarker.exec(part);
    if (image) {
      const src = driveThumbnailUrl(image[1]);
      if (src) nodes.push(
        <figure key={key++} className="my-8 overflow-hidden border border-mahida-200 bg-white p-3 sm:p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={image[2]?.trim() || 'Gambar dalam tulisan'} loading="lazy" className="mx-auto h-auto max-h-[700px] w-full object-contain" />
          {image[2]?.trim() && <figcaption className="mt-3 text-center text-sm text-warm-gray-600">{image[2].trim()}</figcaption>}
        </figure>
      );
      return;
    }
    const video = youtubeMarker.exec(part);
    if (video) {
      const id = youtubeIdFromUrl(video[1]);
      if (id) nodes.push(<YouTubeArticleBlock key={key++} videoId={id} url={video[1]} label={video[2]?.trim()} />);
      return;
    }
    part.split(/\n\s*\n/).map((value) => value.trim()).filter(Boolean).forEach((paragraph) => {
      nodes.push(<p key={key++} dir="auto">{inline(paragraph.replace(/\s*\n\s*/g, ' '))}</p>);
    });
  });
  return <>{nodes}</>;
}
