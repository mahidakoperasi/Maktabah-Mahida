import type { Metadata } from 'next';
import ContentPending from '@/components/ContentPending';

export const metadata: Metadata = { title: 'Karya Mahida' };

export default function Page() {
  return (
    <ContentPending
      eyebrow={'Karya'}
      title={'Karya Mahida'}
      description={'Ruang publikasi karya dan gagasan Mahida.'}
      emptyTitle={'Belum ada karya terbit'}
      emptyDescription={'Karya akan tampil setelah diterbitkan melalui pengelolaan konten Mahida.'}
    />
  );
}
