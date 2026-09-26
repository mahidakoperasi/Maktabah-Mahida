import type { Metadata } from 'next';
import ContentPending from '@/components/ContentPending';

export const metadata: Metadata = { title: 'Maktabah' };

export default function Page() {
  return (
    <ContentPending
      eyebrow={'Maktabah'}
      title={'Ruang Ilmu'}
      description={'Ruang untuk bahan bacaan dan kajian Mahida.'}
      emptyTitle={'Belum ada bahan terbit'}
      emptyDescription={'Bahan bacaan resmi akan tampil setelah tersedia.'}
    />
  );
}
