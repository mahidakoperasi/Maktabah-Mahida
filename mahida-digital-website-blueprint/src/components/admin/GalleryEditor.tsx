'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Save, Send, Trash2 } from 'lucide-react';

type GalleryPhoto = { imageUrl: string; caption: string };
type GalleryData = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  images: Array<{ imageUrl: string; caption: string | null }>;
};

export default function GalleryEditor({ galleryId }: { galleryId?: number }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [images, setImages] = useState<GalleryPhoto[]>([{ imageUrl: '', caption: '' }]);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(Boolean(galleryId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!galleryId) return;
    let active = true;
    fetch(`/api/admin/media/galleries/${galleryId}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Gagal memuat galeri');
        return data.gallery as GalleryData;
      })
      .then((gallery) => {
        if (!active) return;
        setTitle(gallery.title ?? '');
        setDescription(gallery.description ?? '');
        setCoverImage(gallery.coverImage ?? '');
        setStatus(gallery.status === 'published' ? 'published' : 'draft');
        setSlug(gallery.slug ?? '');
        setImages(gallery.images.length
          ? gallery.images.map((image) => ({ imageUrl: image.imageUrl, caption: image.caption ?? '' }))
          : [{ imageUrl: '', caption: '' }]);
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Gagal memuat galeri'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [galleryId]);

  function updateImage(index: number, key: keyof GalleryPhoto, value: string) {
    setImages((current) => current.map((image, imageIndex) => imageIndex === index ? { ...image, [key]: value } : image));
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    setImages((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function save(nextStatus: 'draft' | 'published') {
    setError('');
    setNotice('');
    const validImages = images.filter((image) => image.imageUrl.trim());
    if (!title.trim()) {
      setError('Judul galeri wajib diisi.');
      return;
    }
    if (!coverImage.trim() && validImages.length === 0) {
      setError('Tambahkan minimal satu foto atau URL sampul.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(galleryId ? `/api/admin/media/galleries/${galleryId}` : '/api/admin/media/galleries', {
        method: galleryId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, coverImage, images: validImages, status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menyimpan galeri');
      setStatus(data.gallery.status === 'published' ? 'published' : 'draft');
      setSlug(data.gallery.slug ?? '');
      setNotice(nextStatus === 'published' ? 'Galeri berhasil diterbitkan.' : 'Draft galeri berhasil disimpan.');
      if (!galleryId) router.replace(`/admin/media/galeri/${data.gallery.id}/edit`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan galeri');
    } finally {
      setSaving(false);
    }
  }

  async function removeGallery() {
    if (!galleryId || !window.confirm('Hapus galeri dan seluruh daftar fotonya secara permanen?')) return;
    setSaving(true);
    const response = await fetch(`/api/admin/media/galleries/${galleryId}`, { method: 'DELETE' });
    if (response.ok) {
      router.replace('/admin/media/galeri');
      router.refresh();
      return;
    }
    const data = await response.json();
    setError(data.error || 'Gagal menghapus galeri');
    setSaving(false);
  }

  if (loading) return <p className="text-sm text-warm-gray-500">Memuat galeri...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <Link href="/admin/media/galeri" className="mb-2 inline-flex items-center gap-2 text-sm text-warm-gray-500 hover:text-emerald-forest"><ArrowLeft size={15} /> Daftar Galeri</Link>
          <h1 className="text-2xl font-serif font-bold text-charcoal">{galleryId ? 'Edit Galeri' : 'Galeri Baru'}</h1>
          <p className="mt-1 text-sm text-warm-gray-500">{status === 'published' ? 'Sudah diterbitkan' : 'Masih berupa draft'}{slug ? ` • /${slug}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {galleryId && <button type="button" onClick={removeGallery} disabled={saving} className="inline-flex items-center gap-2 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} /> Hapus</button>}
          <button type="button" onClick={() => save('draft')} disabled={saving} className="btn-secondary"><Save size={16} /> Simpan Draft</button>
          <button type="button" onClick={() => save('published')} disabled={saving} className="btn-primary"><Send size={16} /> {status === 'published' ? 'Perbarui Terbitan' : 'Terbitkan'}</button>
        </div>
      </div>
      {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="border border-warm-gray-200 bg-white p-5">
            <label className="mb-2 block text-sm font-semibold text-charcoal">Judul Album</label>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Contoh: Peringatan Maulid Nabi 2026" className="w-full border border-warm-gray-300 px-4 py-3 text-lg font-semibold outline-none focus:border-emerald-forest" />
          </div>
          <div className="border border-warm-gray-200 bg-white p-5">
            <label className="mb-2 block text-sm font-semibold text-charcoal">Deskripsi</label>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} placeholder="Keterangan singkat album..." className="w-full resize-y border border-warm-gray-300 px-4 py-3 leading-7 outline-none focus:border-emerald-forest" />
          </div>
          <div className="border border-warm-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div><h2 className="font-semibold text-charcoal">Foto Album</h2><p className="mt-1 text-xs text-warm-gray-400">Urutan di editor menjadi urutan tampil di website.</p></div>
              <button type="button" onClick={() => setImages((current) => [...current, { imageUrl: '', caption: '' }])} className="btn-secondary px-3 py-2"><Plus size={15} /> Tambah Foto</button>
            </div>
            <div className="space-y-4">
              {images.map((image, index) => (
                <div key={index} className="grid gap-3 border border-warm-gray-200 bg-warm-gray-50 p-4 md:grid-cols-[96px_1fr_auto]">
                  <div className="aspect-square bg-warm-gray-200 bg-cover bg-center" style={image.imageUrl ? { backgroundImage: `url(${image.imageUrl})` } : undefined}>
                    {!image.imageUrl && <span className="flex h-full items-center justify-center text-xs text-warm-gray-400">Foto {index + 1}</span>}
                  </div>
                  <div className="space-y-2">
                    <input value={image.imageUrl} onChange={(event) => updateImage(index, 'imageUrl', event.target.value)} placeholder="URL foto https://..." className="w-full border border-warm-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-forest" />
                    <input value={image.caption} onChange={(event) => updateImage(index, 'caption', event.target.value)} placeholder="Caption foto (opsional)" className="w-full border border-warm-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-forest" />
                  </div>
                  <div className="flex gap-1 md:flex-col">
                    <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label="Naikkan foto" className="border border-warm-gray-200 bg-white p-2 text-warm-gray-500 disabled:opacity-30"><ArrowUp size={15} /></button>
                    <button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} aria-label="Turunkan foto" className="border border-warm-gray-200 bg-white p-2 text-warm-gray-500 disabled:opacity-30"><ArrowDown size={15} /></button>
                    <button type="button" onClick={() => setImages((current) => current.length === 1 ? [{ imageUrl: '', caption: '' }] : current.filter((_, imageIndex) => imageIndex !== index))} aria-label="Hapus foto" className="border border-red-100 bg-white p-2 text-red-600"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className="space-y-5">
          <div className="border border-warm-gray-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-charcoal">Sampul Galeri</h2>
            {coverImage && <div className="mb-3 aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url(${coverImage})` }} />}
            <input value={coverImage} onChange={(event) => setCoverImage(event.target.value)} placeholder="Kosongkan untuk memakai foto pertama" className="w-full border border-warm-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-forest" />
            <p className="mt-2 text-xs text-warm-gray-400">Jika kosong, foto pertama otomatis menjadi sampul.</p>
          </div>
          <div className="border border-warm-gray-200 bg-white p-5 text-sm">
            <h2 className="mb-3 font-semibold text-charcoal">Ringkasan</h2>
            <p className="text-warm-gray-500">{images.filter((image) => image.imageUrl.trim()).length} foto siap disimpan.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
