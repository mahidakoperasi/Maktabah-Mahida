import type { Metadata } from 'next';
import ContentPending from '@/components/ContentPending';

export const metadata: Metadata = { title: 'Kirim Karya' };

export default function Page() {
  return (
    <ContentPending
      eyebrow={'Karya'}
      title={'Kirim Karya'}
      description={'Informasi pengiriman karya ke Mahida.'}
      emptyTitle={'Pengiriman karya belum dibuka'}
      emptyDescription={'Pedoman dan alamat penerima resmi akan ditampilkan setelah dikonfirmasi.'}
    />
  );
}
