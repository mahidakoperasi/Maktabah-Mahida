import { PublicContentList } from '@/components/PublicContent';

export const dynamic = 'force-dynamic';
export default function Page() {
  return <PublicContentList section="berita" pagePath="/berita" />;
}
