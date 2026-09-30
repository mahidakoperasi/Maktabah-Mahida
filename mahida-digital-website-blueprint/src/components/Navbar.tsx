import { getPublicMenu } from '@/lib/cms';
import NavbarClient from './NavbarClient';
import { getHomepageSettings } from '@/lib/homepage-settings';

export default async function Navbar() {
  const [items, settings] = await Promise.all([
    getPublicMenu(),
    getHomepageSettings(),
  ]);
  return (
    <NavbarClient
      items={items}
      brandName={settings.siteName}
      logoUrl={settings.siteLogoUrl}
    />
  );
}
