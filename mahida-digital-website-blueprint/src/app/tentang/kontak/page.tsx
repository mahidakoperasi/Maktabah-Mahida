import CmsPage from '@/components/CmsPage';
import PublicDirectoryLinks from '@/components/PublicDirectoryLinks';
import { getVisibleDirectory } from '@/lib/public-directory-store';

export const dynamic = 'force-dynamic';
export default async function Page() {
  const directory = await getVisibleDirectory();
  return <>
    <CmsPage path='/tentang/kontak' />
    {(directory.contacts.length > 0 || directory.socials.length > 0) && (
      <section className="bg-cream pb-14" aria-label="Kanal resmi Mahida">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <PublicDirectoryLinks {...directory} />
        </div>
      </section>
    )}
  </>;
}
