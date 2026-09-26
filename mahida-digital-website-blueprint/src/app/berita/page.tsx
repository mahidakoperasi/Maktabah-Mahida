import type { Metadata } from 'next';
import ContentPending from '@/components/ContentPending';

export const metadata: Metadata = { title: 'Berita' };

export default function Page() {
  return (
    <ContentPending
      eyebrow={'Kegiatan'}
      title={'Berita Mahida'}
      description={'Publikasi berita resmi Mahida.'}
      emptyTitle={'Belum ada berita terbit'}
      emptyDescription={'Berita resmi akan tampil setelah tersedia.'}
    />
  );
}
