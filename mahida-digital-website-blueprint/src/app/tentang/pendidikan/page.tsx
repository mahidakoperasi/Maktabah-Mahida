import type { Metadata } from 'next';
import ContentPending from '@/components/ContentPending';

export const metadata: Metadata = { title: 'Pendidikan' };

export default function Page() {
  return (
    <ContentPending
      eyebrow={'Tentang'}
      title={'Pendidikan Mahida'}
      description={'Informasi umum mengenai pendidikan di Mahida.'}
      emptyTitle={'Informasi program sedang disiapkan'}
      emptyDescription={'Rincian program akan tampil setelah diverifikasi oleh pengurus Mahida.'}
    />
  );
}
