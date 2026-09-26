import { getPublicMenu } from '@/lib/cms';
import NavbarClient from './NavbarClient';

export default async function Navbar() {
  return <NavbarClient items={await getPublicMenu()} />;
}
