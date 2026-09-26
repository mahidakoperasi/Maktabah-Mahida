'use client';

import { useEffect, useState } from 'react';
import { driveIdFromUrl } from '@/lib/media-links';
import { rupiah } from '@/lib/rupiah';

type Order = { code: string; amount: number; merchantName: string; qrisImageUrl: string; status: string };
export default function ProductPurchase({ id, name, type, price, inStock, whatsappNumber, ebookReady }: { id: number; name: string; type: string; price: number; inStock: boolean; whatsappNumber: string; ebookReady: boolean }) {
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (type !== 'ebook') return;
    const saved = sessionStorage.getItem(`mahida-ebook-order-${id}`);
    if (!saved) return;
    try {
      const receipt = JSON.parse(saved) as { email?: string; order?: Order };
      if (receipt.email && receipt.order?.code?.startsWith('MH-')) {
        queueMicrotask(() => { setEmail(receipt.email!); setOrder(receipt.order!); });
      }
    } catch { sessionStorage.removeItem(`mahida-ebook-order-${id}`); }
  }, [id, type]);

  if (type === 'physical_book') {
    if (!inStock) return <p className="border bg-white p-5">Buku belum tersedia untuk dipesan.</p>;
    if (!whatsappNumber) return <p className="border bg-white p-5">Pemesanan via WhatsApp akan tersedia setelah nomor koperasi diisi admin.</p>;
    const subtotal = price * quantity;
    const text = `Assalamu'alaikum. Saya ingin memesan buku Mahida.\nProduk: ${name}\nTipe: Buku Fisik\nJumlah: ${quantity}\nHarga satuan: ${rupiah(price)}\nTotal estimasi: ${rupiah(subtotal)} (belum termasuk ongkir).\nMohon konfirmasi ketersediaan dan ongkos kirim.`;
    return <div className="border bg-white p-5"><label className="block text-sm font-semibold">Jumlah buku<input type="number" min="1" max="99" value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(99, Math.trunc(Number(event.target.value) || 1))))} className="mt-2 block w-28 border p-3" /></label><p className="my-4">Total estimasi: <strong>{rupiah(subtotal)}</strong></p><a className="btn-primary inline-flex" href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">Pesan via WhatsApp ↗</a><p className="mt-3 text-xs text-warm-gray-600">Ongkir dan pembayaran dikonfirmasi admin koperasi di WhatsApp.</p></div>;
  }

  if (!ebookReady) return <p className="border bg-white p-5">Pembelian e-book belum dibuka. QRIS resmi sedang disiapkan.</p>;

  async function createOrder(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/orders/ebook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: id, email }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal membuat pesanan');
      setOrder(result);
      sessionStorage.setItem(`mahida-ebook-order-${id}`, JSON.stringify({ email, order: result }));
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Gagal membuat pesanan'); }
    finally { setBusy(false); }
  }

  async function reportPayment() {
    if (!order) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/orders/ebook', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: order.code, email }) });
      const result = await response.json();
      setMessage(response.ok ? 'Terima kasih. Admin akan memeriksa transaksi QRIS sebelum mengirim e-book ke email Anda.' : result.error || 'Gagal mengirim laporan');
      if (response.ok) {
        const updated = { ...order, status: 'payment_review' };
        setOrder(updated);
        sessionStorage.setItem(`mahida-ebook-order-${id}`, JSON.stringify({ email, order: updated }));
      }
    } catch { setMessage('Koneksi gagal. Coba lagi.'); }
    finally { setBusy(false); }
  }

  return <div className="border bg-white p-5">
    {!order ? <form onSubmit={createOrder} className="space-y-4"><label className="block text-sm font-semibold">Email penerima e-book<input type="email" required maxLength={255} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 block w-full border p-3" /></label><p className="text-sm">Harga: <strong>{rupiah(price)}</strong></p><p className="text-xs text-warm-gray-600">Email digunakan hanya untuk pesanan dan pengiriman e-book. Pengiriman dilakukan manual setelah pembayaran diverifikasi.</p><button type="submit" disabled={busy} className="btn-primary">Lanjut ke QRIS</button></form>
      : <div className="space-y-4"><h2 className="font-serif text-xl font-bold">Pesanan {order.code}</h2><p>Simpan kode ini. Bayar tepat <strong>{rupiah(order.amount)}</strong> ke merchant <strong>{order.merchantName}</strong>.</p><p className="text-xs text-warm-gray-600">QRIS statis: masukkan nominal sendiri di aplikasi pembayaran. Periksa nama penerima sebelum membayar.</p><iframe title="QRIS resmi koperasi" src={`https://drive.google.com/file/d/${driveIdFromUrl(order.qrisImageUrl)}/preview`} className="aspect-square w-full max-w-md border" /><a href={order.qrisImageUrl} target="_blank" rel="noopener noreferrer" className="block text-sm text-emerald-forest">Buka gambar QRIS di Google Drive ↗</a>{order.status === 'awaiting_payment' && <button type="button" disabled={busy} onClick={reportPayment} className="btn-primary">Saya sudah bayar</button>}<p className="text-sm text-warm-gray-600">Pembayaran diperiksa manual dari riwayat transaksi. E-book akan dikirim manual ke {email} setelah cocok.</p></div>}
    {message && <p role="status" className="mt-4 border bg-mahida-50 p-3 text-sm">{message}</p>}
  </div>;
}
