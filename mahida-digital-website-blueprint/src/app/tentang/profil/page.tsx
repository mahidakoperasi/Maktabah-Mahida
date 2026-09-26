import type { Metadata } from 'next';
import ContentPending from '@/components/ContentPending';

export const metadata: Metadata = { title: 'Profil Pondok' };

export default function Page() {
  return (
    <ContentPending
      eyebrow={'Tentang'}
      title={'Profil Pondok'}
      description={'Informasi umum mengenai Pondok Pesantren Mahida.'}
      emptyTitle={'Profil resmi sedang disiapkan'}
      emptyDescription={'Identitas, visi, dan misi akan tampil setelah diverifikasi oleh pengurus Mahida.'}
    />
  );
}
