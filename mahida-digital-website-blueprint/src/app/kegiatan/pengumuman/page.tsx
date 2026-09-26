import type { Metadata } from 'next';
import ContentPending from '@/components/ContentPending';

export const metadata: Metadata = { title: 'Pengumuman' };

export default function Page() {
  return (
    <ContentPending
      eyebrow={'Kegiatan'}
      title={'Pengumuman'}
      description={'Informasi dan pengumuman resmi Mahida.'}
      emptyTitle={'Belum ada pengumuman terbit'}
      emptyDescription={'Pengumuman resmi akan tampil setelah tersedia.'}
    />
  );
}
