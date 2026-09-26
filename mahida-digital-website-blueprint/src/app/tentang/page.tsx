import type { Metadata } from 'next';
import ContentPending from '@/components/ContentPending';

export const metadata: Metadata = { title: 'Tentang Mahida' };

export default function Page() {
  return (
    <ContentPending
      eyebrow={'Tentang'}
      title={'Tentang Mahida'}
      description={'Informasi resmi mengenai Mahida.'}
      emptyTitle={'Profil resmi sedang disiapkan'}
      emptyDescription={'Rincian profil akan tampil setelah diverifikasi oleh pengurus Mahida.'}
    />
  );
}
