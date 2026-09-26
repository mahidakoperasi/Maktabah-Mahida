import { driveIdFromUrl } from '@/lib/media-links';

export default function DrivePreview({ url, title }: { url: string; title: string }) {
  const fileId = driveIdFromUrl(url);
  if (!fileId) return null;
  return <div className="overflow-hidden border border-mahida-200 bg-white"><iframe loading="lazy" title={title} src={`https://drive.google.com/file/d/${fileId}/preview`} className="aspect-[4/3] w-full" /><a href={url} target="_blank" rel="noopener noreferrer" className="block p-3 text-sm text-emerald-forest">Buka gambar di Google Drive ↗</a></div>;
}
