import { driveIdFromUrl, videoEmbedFromUrl } from './media-links';

export function invalidDriveImages(content: string): boolean {
  return content.split(/\[\[image:/i).slice(1).some((part) => {
    if (!part.includes(']]')) return true;
    const marker = /^\[\[image:(https:\/\/[^\]|\s]+)(?:\|([^\]]{0,200}))?\]\]$/i.exec(`[[image:${part.split(']]')[0]}]]`);
    return !marker || !driveIdFromUrl(marker[1]);
  });
}

export function invalidVideoMarkers(content: string): boolean {
  return content.split(/\[\[(?:video|youtube):/i).slice(1).some((part) => {
    if (!part.includes(']]')) return true;
    const marker = /^\[\[(?:video|youtube):(https:\/\/[^\]|\s]+)(?:\|([^\]]{0,200}))?\]\]$/i.exec(`[[video:${part.split(']]')[0]}]]`);
    return !marker || !videoEmbedFromUrl(marker[1]);
  });
}
