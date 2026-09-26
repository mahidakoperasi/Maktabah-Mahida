import type { Metadata } from 'next';
import ContentPending from '@/components/ContentPending';

export const metadata: Metadata = { title: 'Kegiatan' };

export default function Page() {
  return (
    <ContentPending
      eyebrow={'Kegiatan'}
      title={'Kegiatan Mahida'}
      description={'Informasi kegiatan Mahida.'}
      emptyTitle={'Belum ada kegiatan terbit'}
      emptyDescription={'Kegiatan resmi akan tampil setelah tersedia.'}
    />
  );
}
