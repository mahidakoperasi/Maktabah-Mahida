import type { Metadata } from 'next';
import ContentPending from '@/components/ContentPending';

export const metadata: Metadata = { title: 'Media' };

export default function Page() {
  return (
    <ContentPending
      eyebrow={'Media'}
      title={'Media dan Dokumentasi'}
      description={'Ruang dokumentasi dan publikasi media Mahida.'}
      emptyTitle={'Belum ada media terbit'}
      emptyDescription={'Dokumentasi resmi akan tampil setelah tersedia.'}
    />
  );
}
