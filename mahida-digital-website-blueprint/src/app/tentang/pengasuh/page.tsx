import type { Metadata } from 'next';
import ContentPending from '@/components/ContentPending';

export const metadata: Metadata = { title: 'Pengasuh' };

export default function Page() {
  return (
    <ContentPending
      eyebrow={'Tentang'}
      title={'Pengasuh Mahida'}
      description={'Informasi resmi mengenai pengasuh Mahida.'}
      emptyTitle={'Informasi pengasuh sedang disiapkan'}
      emptyDescription={'Nama, jabatan, dan profil akan tampil setelah diverifikasi oleh pengurus Mahida.'}
    />
  );
}
