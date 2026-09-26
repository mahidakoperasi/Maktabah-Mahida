import type { Metadata } from 'next';
import ContentPending from '@/components/ContentPending';

export const metadata: Metadata = { title: 'Koperasi Mahida' };

export default function Page() {
  return (
    <ContentPending
      eyebrow={'Koperasi'}
      title={'Koperasi Mahida'}
      description={'Informasi koperasi Mahida.'}
      emptyTitle={'Belum ada produk terbit'}
      emptyDescription={'Katalog resmi akan tampil setelah produk dan informasinya diverifikasi.'}
    />
  );
}
