'use client';

import { useEffect, useState } from 'react';
import { rupiah } from '@/lib/rupiah';
type Order = { id: number; code: string; email: string; price: number; status: string; createdAt: string; reportedAt: string | null; paidAmount: number | null; paidAt: string | null; verifiedAt: string | null; deliveredAt: string | null; productName: string; digitalFileUrl: string | null };
const formatTime = (value: string) => new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
export default function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  async function load() {
    const response = await fetch(`/api/admin/orders?page=${page}`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Gagal memuat pesanan');
    setOrders(data.orders);
    setTotal(data.total);
  }
  useEffect(() => {
    let active = true;
    fetch(`/api/admin/orders?page=${page}`, { cache: 'no-store' }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal memuat pesanan');
      if (active) { setOrders(data.orders); setTotal(data.total); }
    }).catch((error) => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, [page]);
  async function change(id: number, action: string, payment?: { paidAmount: number; paidAt: string }) {
    const warning = action === 'verify' ? 'Pastikan nominal dan waktu benar-benar cocok dengan riwayat merchant QRIS. Tandai lunas?' : action === 'delivered' ? 'Pastikan e-book sudah dibagikan lewat Drive dan email sudah dikirim. Tandai terkirim?' : 'Batalkan pesanan?';
    if (!confirm(warning)) return;
    try {
      const response = await fetch('/api/admin/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action, ...payment }) });
      const data = await response.json();
      setMessage(response.ok ? 'Status pesanan diperbarui.' : data.error || 'Gagal mengubah status');
      if (response.ok) await load();
    } catch { setMessage('Koneksi gagal. Coba lagi.'); }
  }
  function verify(event: React.FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    void change(id, 'verify', { paidAmount: Number(values.get('paidAmount')), paidAt: new Date(String(values.get('paidAt'))).toISOString() });
  }
  return <div className="space-y-5"><h1 className="font-serif text-3xl font-bold">Riwayat Pesanan E-Book</h1><p className="text-sm text-warm-gray-600">Daftar ini berasal dari pesanan situs, bukan mutasi QRIS otomatis. Periksa mutasi pada aplikasi merchant, lalu catat nominal dan waktu pembayaran yang cocok. Bagikan berkas dan kirim email secara manual sebelum menandai pesanan terkirim.</p>{message && <p role="status" className="bg-white p-4">{message}</p>}{total === 0 && <p className="bg-white p-5">Belum ada pesanan.</p>}{orders.map((order) => <article key={order.id} className="space-y-3 border bg-white p-5"><h2 className="font-semibold">{order.productName} · {order.code}</h2><p className="text-sm">Email: <strong>{order.email}</strong> · Tagihan: <strong>{rupiah(order.price)}</strong> · Status: {order.status}</p><p className="text-xs text-warm-gray-500">Dibuat: {formatTime(order.createdAt)}{order.reportedAt && ` · Dilaporkan pembeli: ${formatTime(order.reportedAt)}`}</p>{order.paidAt && <p className="text-sm">Mutasi dicatat admin: <strong>{rupiah(order.paidAmount ?? 0)}</strong> pada {formatTime(order.paidAt)}{order.verifiedAt && ` · Diverifikasi: ${formatTime(order.verifiedAt)}`}{order.deliveredAt && ` · Terkirim: ${formatTime(order.deliveredAt)}`}</p>}{order.status === 'payment_review' && <form onSubmit={(event) => verify(event, order.id)} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><label className="text-sm">Nominal pada mutasi QRIS<input type="number" name="paidAmount" required min="0" step="1" defaultValue={order.price} className="mt-1 block w-full border p-2" /></label><label className="text-sm">Waktu pembayaran dari mutasi<input type="datetime-local" name="paidAt" required className="mt-1 block w-full border p-2" /></label><button type="submit" className="btn-primary">Verifikasi manual</button></form>}{order.status === 'paid' && <div className="space-y-3"><p className="text-sm text-warm-gray-600">Bagikan e-book kepada {order.email} melalui Google Drive, lalu kirim email manual.</p>{order.digitalFileUrl && <a href={order.digitalFileUrl} target="_blank" rel="noopener noreferrer" className="block text-sm text-emerald-forest">Buka berkas terbatas di Drive ↗</a>}<button type="button" className="btn-primary" onClick={() => change(order.id,'delivered')}>Sudah dikirim</button></div>}{order.status === 'awaiting_payment' && <button type="button" className="text-sm text-red-700" onClick={() => change(order.id,'cancel')}>Batalkan</button>}</article>)}<nav aria-label="Halaman riwayat pesanan" className="flex items-center gap-4"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="border bg-white px-4 py-2 disabled:opacity-50">Sebelumnya</button><span className="text-sm">Halaman {page} dari {Math.max(1, Math.ceil(total / 50))}</span><button disabled={page * 50 >= total} onClick={() => setPage(page + 1)} className="border bg-white px-4 py-2 disabled:opacity-50">Berikutnya</button></nav></div>;
}
