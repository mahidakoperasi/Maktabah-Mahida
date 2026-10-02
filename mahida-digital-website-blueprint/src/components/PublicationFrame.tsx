import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { getDesign } from '@/lib/design-store';
import { getPublicMenu } from '@/lib/cms';
import { designPath } from '@/lib/design-schema';
import GallerySidebar from './GallerySidebar';
import HeaderLogo from './HeaderLogo';
export default async function PublicationFrame({ children }: { children: ReactNode }) {
  const path = (await headers()).get('x-mahida-public-path') ?? '';
  if (!path || path.startsWith('/admin') || path === '/masuk') return children;
  const scope = path.startsWith('/media/galeri/') ? '/media/galeri' : path;
  const design = designPath(scope) ? await getDesign(scope, 'media', true) : null;
  const logo = design?.headerLogoUrl;
  return (
    <>
      {logo && <HeaderLogo url={logo} />}
      {scope === '/media/galeri' ? (
        <GallerySidebar items={await getPublicMenu()}>{children}</GallerySidebar>
      ) : (
        children
      )}
    </>
  );
}
