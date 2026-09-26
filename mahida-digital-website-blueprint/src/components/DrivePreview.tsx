import { driveIdFromUrl } from '@/lib/media-links';

export default function DrivePreview({ url, title }: { url: string; title: string }) {
  const fileId = driveIdFromUrl(url);
  if (!fileId) return null;
  return <div className="mx-auto w-full max-w-2xl overflow-hidden border border-mahida-200 bg-white"><iframe loading="lazy" title={title} src={`https://drive.google.com/file/d/${fileId}/preview`} className="block aspect-[4/3] w-full" /><a href={url} target="_blank" rel="noopener noreferrer" className="block min-h-11 p-3 text-sm text-emerald-forest">Buka gambar di Google Drive ↗</a></div>;
}
