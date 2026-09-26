import type { Metadata } from 'next';
import ContentPending from '@/components/ContentPending';

export const metadata: Metadata = { title: 'Arsip' };

export default function Page() {
  return (
    <ContentPending
      eyebrow={'Arsip'}
      title={'Arsip Digital'}
      description={'Ruang arsip publikasi Mahida.'}
      emptyTitle={'Belum ada arsip terbit'}
      emptyDescription={'Arsip akan tampil setelah konten resmi tersedia.'}
    />
  );
}
