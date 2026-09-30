import type { Metadata } from 'next';
import ContentPending from '@/components/ContentPending';

export const metadata: Metadata = { title: 'Prestasi' };

export default function Page() {
  return (
    <ContentPending
      eyebrow={'Kegiatan'}
      title={'Prestasi Mahida'}
      description={'Ruang publikasi prestasi Mahida.'}
      emptyTitle={'Belum ada prestasi terbit'}
      emptyDescription={'Prestasi resmi akan tampil setelah tersedia.'}
    />
  );
}
