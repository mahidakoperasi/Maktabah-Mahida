'use client';

import { useEffect, useState } from 'react';
type Product = { id: number; name: string; slug: string; description: string | null; productType: string; price: number; imageUrl: string | null; digitalFileUrl: string | null; inStock: boolean; status: string };
type Form = { id?: number; name: string; description: string; productType: string; price: number; imageUrl: string; digitalFileUrl: string; inStock: boolean; status: string };
const blank: Form = { name: '', description: '', productType: 'physical_book', price: 0, imageUrl: '', digitalFileUrl: '', inStock: true, status: 'draft' };
export default function ProductsManager() {
  const [items, setItems] = useState<Product[]>([]);
  const [form, setForm] = useState<Form>(blank);
  const [message, setMessage] = useState('');
  async function load() {
    const response = await fetch('/api/admin/products', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Gagal memuat produk');
    setItems(data.items);
  }
  useEffect(() => {
    let active = true;
    fetch('/api/admin/products', { cache: 'no-store' }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal memuat produk');
      if (active) setItems(data.items);
    }).catch((err) => { if (active) setMessage(err.message); });
    return () => { active = false; };
  }, []);
  async function submit(method: string, payload: unknown) {
    try {
      const response = await fetch('/api/admin/products', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menyimpan');
      await load(); setForm(blank); setMessage('Produk disimpan.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Gagal menyimpan'); }
  }
  return <div className="grid gap-8 xl:grid-cols-2"><section className="space-y-3"><h1 className="font-serif text-3xl font-bold">Produk Koperasi</h1>{items.length === 0 && <p className="empty-state">Belum ada produk.</p>}{items.map((product) => <button key={product.id} onClick={() => setForm({ id: product.id, name: product.name, description: product.description ?? '', productType: product.productType, price: product.price, imageUrl: product.imageUrl ?? '', digitalFileUrl: product.digitalFileUrl ?? '', inStock: product.inStock, status: product.status })} className="block w-full border bg-white p-4 text-left">{product.name} <small>({product.productType === 'ebook' ? 'E-Book' : 'Buku Fisik'} · {product.status})</small></button>)}</section>
    <form onSubmit={(event) => { event.preventDefault(); submit(form.id ? 'PATCH' : 'POST', form); }} className="space-y-4 border bg-white p-5"><h2 className="font-serif text-xl font-bold">{form.id ? 'Edit produk' : 'Tambah produk'}</h2>{message && <p role="status" className="bg-mahida-50 p-3 text-sm">{message}</p>}
      <label className="block text-sm">Nama<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full border p-3" /></label>
      <label className="block text-sm">Jenis<select value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value, digitalFileUrl: '' })} className="mt-1 w-full border p-3"><option value="physical_book">Buku Fisik</option><option value="ebook">E-Book</option></select></label>
      <label className="block text-sm">Harga (rupiah)<input type="number" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="mt-1 w-full border p-3" /></label>
      <label className="block text-sm">Deskripsi<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="mt-1 w-full border p-3" /></label>
      <label className="block text-sm">URL foto sampul Google Drive<input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="mt-1 w-full border p-3" /></label>
      {form.productType === 'ebook' && <label className="block text-sm">URL e-book terbatas (hanya admin)<input value={form.digitalFileUrl} onChange={(e) => setForm({ ...form, digitalFileUrl: e.target.value })} className="mt-1 w-full border p-3" /><span className="text-xs text-warm-gray-500">Jaga akses Drive sebagai Restricted. Bagikan ke pembeli setelah pembayaran terverifikasi.</span></label>}
      {form.productType === 'physical_book' && <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.inStock} onChange={(e) => setForm({ ...form, inStock: e.target.checked })} /> Tersedia untuk dipesan</label>}
      <label className="block text-sm">Status<select value={form.status === 'published' ? 'published' : 'draft'} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 w-full border p-3"><option value="draft">Draft</option><option value="published">Terbit</option></select></label>
      <div className="flex gap-3"><button className="btn-primary" type="submit">Simpan</button><button type="button" className="btn-secondary" onClick={() => setForm(blank)}>Produk baru</button>{form.id && <button type="button" className="text-red-700" onClick={() => { if (confirm('Hapus produk?')) submit('DELETE', { id: form.id }); }}>Hapus</button>}</div>
    </form></div>;
}
