import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { getDesign } from '@/lib/design-store';
import { getPublicMenu } from '@/lib/cms';
import { designPath } from '@/lib/design-schema';
import GallerySidebar from './GallerySidebar';
import HeaderLogo from './HeaderLogo';
async function publicationScope() {
  const path = (await headers()).get('x-mahida-public-path') ?? '';
  if (!path || path.startsWith('/admin') || path === '/masuk') return null;
  return path.startsWith('/media/galeri/') ? '/media/galeri' : path;
}

export async function PublicationHeader() {
  const scope = await publicationScope();
  if (!scope) return null;
  const design = designPath(scope) ? await getDesign(scope, 'media', true) : null;
  const logo = design?.headerLogoUrl;
  return logo ? <HeaderLogo key={logo} url={logo} /> : null;
}

export default async function PublicationFrame({ children }: { children: ReactNode }) {
  const scope = await publicationScope();
  return scope === '/media/galeri' ? (
    <GallerySidebar items={await getPublicMenu()}>{children}</GallerySidebar>
  ) : (
    children
  );
}
