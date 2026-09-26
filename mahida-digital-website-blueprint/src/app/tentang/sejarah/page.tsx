import type { Metadata } from 'next';
import ContentPending from '@/components/ContentPending';

export const metadata: Metadata = { title: 'Sejarah Mahida' };

export default function Page() {
  return (
    <ContentPending
      eyebrow={'Tentang'}
      title={'Sejarah Mahida'}
      description={'Ruang untuk riwayat resmi Mahida.'}
      emptyTitle={'Riwayat resmi sedang disiapkan'}
      emptyDescription={'Tahun dan peristiwa akan tampil setelah diverifikasi oleh pengurus Mahida.'}
    />
  );
}
