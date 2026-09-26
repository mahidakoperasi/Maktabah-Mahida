import type { Metadata } from 'next';
import ContentPending from '@/components/ContentPending';

export const metadata: Metadata = { title: 'Agenda' };

export default function Page() {
  return (
    <ContentPending
      eyebrow={'Kegiatan'}
      title={'Agenda Mahida'}
      description={'Informasi agenda resmi Mahida.'}
      emptyTitle={'Belum ada agenda terbit'}
      emptyDescription={'Agenda resmi akan tampil setelah tersedia.'}
    />
  );
}
