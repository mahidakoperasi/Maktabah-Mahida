import { getPublicMenu } from '@/lib/cms';
import SectionNavigationClient from './SectionNavigationClient';

export default async function SectionNavigation() {
  return <SectionNavigationClient items={await getPublicMenu()} />;
}
