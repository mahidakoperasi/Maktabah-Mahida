'use client';
/* eslint-disable @next/next/no-img-element -- Drive thumbnails curated by admin. */
import useDraftAutosave from './useDraftAutosave';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import GalleryLightbox from '@/components/GalleryLightbox';
import { driveIdFromUrl, publicImageUrl } from '@/lib/media-links';
import { galleryPhotoSchema, gallerySchema, photoFromCandidate, type DriveCandidate, type GalleryData, type GalleryPhoto } from '@/lib/gallery-schema';

type Album = { id: number; slug: string; status: string; revision: number; draft: GalleryData; published: GalleryData | null; candidates: DriveCandidate[]; history: { at: string; by: number; action: string; data: GalleryData }[]; syncedAt: string | null };
const empty: GalleryData = { title: '', description: '', folderUrl: '', layout: 'masonry', photos: [] };
const field = 'mt-1 w-full min-w-0 border border-warm-gray-300 bg-white p-2.5 text-sm';
function Thumbnail({ url, alt }: { url: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? <p className="flex h-32 items-center justify-center bg-warm-gray-100 px-3 text-center text-xs">Foto tidak terbaca. Periksa akses publik berkas di Drive.</p> : <img src={publicImageUrl(url) ?? ''} alt={alt} loading="lazy" onError={() => setFailed(true)} className="h-32 w-full bg-warm-gray-100 object-contain" />;
}
export default function GalleryManager() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [album, setAlbum] = useState<Album | null>(null);
  const [form, setForm] = useState<GalleryData>(empty);
  const [baseline, setBaseline] = useState(JSON.stringify(empty));
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [links, setLinks] = useState('');
  const [preview, setPreview] = useState(false);
  const [conflict, setConflict] = useState(false);
  const dirty = JSON.stringify(form) !== baseline;
  const selectedCount = form.photos.filter((p) => p.selected).length;

  useEffect(() => {
    let active = true;
    fetch('/api/admin/galleries', { cache: 'no-store' }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'Gagal memuat album');
      if (active) { setAlbums(data.items); setConfigured(data.driveConfigured); }
    }).catch((e) => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function open(next: Album | null, force = false) {
    if (!force && dirty && !confirm('Ada perubahan belum disimpan. Tinggalkan perubahan ini?')) return;
    const draft = next?.draft ?? empty;
    setAlbum(next); setForm(draft); setBaseline(JSON.stringify(draft)); setNotice(''); setError(''); setConflict(false); setLinks(''); setPreview(false);
  }
  async function submit(action: 'draft' | 'publish' | 'sync' | 'archive') {
    if (action === 'sync' && (!album || dirty)) { setError('Simpan draft dan tautan folder dahulu sebelum sinkronisasi.'); return; }
    if (action === 'publish') {
      const checked = gallerySchema.safeParse(form);
      if (!checked.success) { setError(checked.error.issues[0].message); return; }
      if (!confirm('Terbitkan foto terpilih yang ditampilkan? Kandidat lain tetap privat.')) return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/admin/galleries', { method: album ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: album?.id, revision: album?.revision ?? 0, action, ...(['draft', 'publish'].includes(action) ? { data: form } : {}) }) });
      const result = await response.json();
      if (!response.ok) { if (response.status === 409) setConflict(true); throw Error(result.error || 'Gagal menyimpan album'); }
      const next = result as Album;
      setAlbum(next); setForm(next.draft); setBaseline(JSON.stringify(next.draft)); setConflict(false);
      setAlbums((old) => [next, ...old.filter((item) => item.id !== next.id)]);
      setNotice(action === 'sync' ? `${next.candidates.filter((p) => !p.missing).length} kandidat dari folder. Foto baru belum dipilih dan belum tampil publik.` : action === 'publish' ? 'Album diterbitkan. Terbitan hanya berisi foto terpilih dan tampil.' : action === 'archive' ? 'Album diarsipkan. Foto di Drive tidak dihapus.' : 'Draft disimpan. Terbitan yang sudah ada tidak berubah.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal menyimpan'); }
    finally { setBusy(false); }
  }
  useDraftAutosave(dirty, busy || loading || conflict || Boolean(error), gallerySchema.safeParse(form).success, () => submit('draft'));
  async function reload() {
    if (dirty && !confirm('Muat versi terbaru dari server? Perubahan lokal yang belum disimpan akan ditinggalkan.')) return;
    setBusy(true);
    try {
      const response = await fetch('/api/admin/galleries', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      setAlbums(data.items); setConfigured(data.driveConfigured);
      open(data.items.find((p: Album) => p.id === album?.id) ?? null, true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat ulang'); }
    finally { setBusy(false); }
  }
  function patchPhoto(id: string, patch: Partial<GalleryPhoto>) {
    if (patch.selected && selectedCount >= 40) { setError('Maksimal 40 foto terpilih. Batalkan pilihan foto lain dahulu.'); return; }
    setForm((f) => ({ ...f, photos: f.photos.map((p) => p.id === id ? { ...p, ...patch } : p) }));
  }
  function add(candidate: DriveCandidate) {
    if (selectedCount >= 40) { setError('Maksimal 40 foto terpilih.'); return; }
    setForm((f) => ({ ...f, photos: [...f.photos, photoFromCandidate(candidate)] }));
  }
  function move(index: number, direction: number) {
    const next = index + direction;
    if (next < 0 || next >= form.photos.length) return;
    const photos = [...form.photos]; [photos[index], photos[next]] = [photos[next], photos[index]];
    setForm({ ...form, photos });
  }
  function addLinks() {
    const photos = [...form.photos];
    for (const line of links.split('\n').map((l) => l.trim()).filter(Boolean)) {
      const [url, ...caption] = line.split('|');
      const id = driveIdFromUrl(url.trim());
      if (!id) { setError('Gunakan tautan berkas foto Drive, bukan folder. Tidak ada foto baru yang ditambahkan.'); return; }
      if (photos.some((p) => driveIdFromUrl(p.imageUrl) === id)) continue;
      const checked = galleryPhotoSchema.safeParse({ id, imageUrl: url.trim(), caption: caption.join('|').trim() });
      if (!checked.success) { setError(checked.error.issues[0].message); return; }
      photos.push(checked.data);
    }
    if (photos.filter((p) => p.selected).length > 40) { setError('Maksimal 40 foto terpilih. Kurangi jumlah tautan.'); return; }
    setForm({ ...form, photos }); setLinks(''); setError('');
  }
  const candidates = (album?.candidates ?? []).filter((p) => !form.photos.some((photo) => driveIdFromUrl(photo.imageUrl) === p.id) && p.name.toLocaleLowerCase('id').includes(candidateSearch.toLocaleLowerCase('id')));
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-serif text-3xl font-bold">Galeri Foto</h1><p className="mt-2 text-sm text-warm-gray-600">Satu album dari satu folder Drive. Sinkronisasi hanya menambah kandidat; terbitkan setelah kurasi dan pratinjau.</p></div><button type="button" disabled={busy} className="btn-secondary" onClick={() => open(null)}>Album baru</button></div>
    {error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error} {conflict && <button type="button" className="underline" onClick={reload}>Muat versi terbaru</button>}</p>}
    {notice && <p role="status" className="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <div className="grid min-w-0 gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-3"><label className="block text-sm">Cari album<input className={field} value={search} onChange={(e) => setSearch(e.target.value)} /></label>{loading && <p>Memuat album…</p>}{albums.filter((p) => p.draft.title.toLocaleLowerCase('id').includes(search.toLocaleLowerCase('id'))).map((p) => <button type="button" disabled={busy} key={p.id} onClick={() => open(p)} className={`block w-full break-words border p-3 text-left text-sm ${album?.id === p.id ? 'border-emerald-forest bg-mahida-50' : 'bg-white'}`}><strong>{p.draft.title}</strong><span className="mt-1 block text-xs">{p.status === 'published' ? 'Terbit • draft terpisah' : p.status === 'archived' ? 'Arsip' : 'Draft'}</span></button>)}</aside>
      <fieldset disabled={busy || loading} className="min-w-0 space-y-5 disabled:opacity-70">
        <section className="space-y-4 border bg-white p-4 sm:p-5">
          <h2 className="font-semibold">{album ? 'Kelola album' : 'Buat album'}</h2>{album && <Link className="text-sm underline" href={`/admin/tampilan/penerbitan?target=gallery:${album.id}`}>Pratinjau halaman lengkap, jadwal & riwayat terbit</Link>}
          <label className="block text-sm">Judul album<input required maxLength={500} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={field} /></label>
          <label className="block text-sm">Keterangan album<textarea maxLength={5000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={field} /></label>
          <label className="block text-sm">Tautan folder Google Drive<input type="url" value={form.folderUrl} onChange={(e) => setForm({ ...form, folderUrl: e.target.value })} className={field} placeholder="https://drive.google.com/drive/folders/..." /></label>
          <p className="text-xs text-warm-gray-600">Bagikan folder: Siapa saja yang memiliki link → Pelihat. Hanya foto langsung di folder ini (bukan subfolder) yang diambil. Folder maksimal 500 kandidat; album maksimal 40 foto terpilih.</p>
          {!configured && <p className="bg-amber-50 p-3 text-sm text-amber-800">Sinkronisasi folder memerlukan GOOGLE_DRIVE_API_KEY di server. Input foto satu per satu di bawah tetap aktif.</p>}
          <div className="flex flex-wrap gap-3"><button type="button" className="btn-primary" onClick={() => submit('draft')}>{busy ? 'Memproses…' : 'Simpan Draft'}</button><button type="button" className="btn-secondary disabled:opacity-50" disabled={!album || dirty || !form.folderUrl || !configured} onClick={() => submit('sync')}>{album?.syncedAt ? 'Sinkronkan Folder' : 'Ambil Foto dari Folder'}</button></div>
          {dirty && <p className="text-xs text-amber-800">Ada perubahan belum disimpan. Simpan draft sebelum sinkronisasi folder.</p>}
          {album?.syncedAt && <p className="text-xs">Terakhir disinkronkan: {new Date(album.syncedAt).toLocaleString('id-ID')}</p>}
          <label className="block text-sm">Layout<select aria-label="Layout album" className={field} value={form.layout} onChange={(e) => setForm({ ...form, layout: e.target.value as GalleryData['layout'] })}><option value="grid">Grid rapi</option><option value="masonry">Masonry dokumentasi</option><option value="spotlight">Sorotan kegiatan</option></select></label>
        </section>
        <section className="space-y-3 border bg-white p-4"><h2 className="font-semibold">Kandidat dari Folder</h2><p className="text-xs">Menambahkan kandidat ke album belum menerbitkannya. Foto yang hilang dari folder diberi tanda; kurasi dan terbitan tidak dihapus otomatis.</p><label className="block text-sm">Cari kandidat<input className={field} value={candidateSearch} onChange={(e) => setCandidateSearch(e.target.value)} /></label><div className="grid max-h-[480px] grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">{candidates.map((p) => <div key={p.id} className="min-w-0 space-y-2 border p-2"><Thumbnail url={p.imageUrl} alt={p.name} /><p className="break-words text-xs">{p.name}</p>{p.missing ? <p className="text-xs text-amber-800">Tidak ditemukan pada sinkronisasi terakhir</p> : <button type="button" className="btn-secondary w-full justify-center text-xs" onClick={() => add(p)}>Pilih untuk album</button>}</div>)}</div>{!candidates.length && <p className="text-sm text-warm-gray-500">Belum ada kandidat yang belum dipilih. Sinkronkan folder atau tambahkan tautan manual.</p>}</section>
        <details className="border bg-white p-4"><summary className="cursor-pointer font-semibold">Tambah foto satu per satu (metode lama)</summary><label className="mt-3 block text-sm">Satu tautan foto Google Drive per baris; opsional: | keterangan<textarea value={links} onChange={(e) => setLinks(e.target.value)} className={field} rows={4} /></label><button type="button" className="btn-secondary mt-3" onClick={addLinks}>Tambahkan foto</button></details>
        <section className="space-y-4"><h2 className="font-semibold">Kurasi foto ({selectedCount}/40 terpilih)</h2>{!form.photos.length && <p className="empty-state">Pilih kandidat atau tambahkan tautan foto.</p>}{form.photos.map((p, index) => <article key={p.id} className="space-y-3 border bg-white p-4">
          <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]"><div><Thumbnail url={p.imageUrl} alt={p.alt || p.title || 'Foto album'} /><a href={p.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs text-emerald-forest underline">Lihat berkas di Drive</a>{album?.candidates.find((c) => c.id === driveIdFromUrl(p.imageUrl))?.missing && <p className="mt-2 text-xs text-amber-800">Foto tidak ditemukan pada sinkronisasi terakhir. Periksa Drive sebelum menerbitkan.</p>}</div><div className="min-w-0 space-y-2"><div className="flex flex-wrap gap-4 text-sm"><label><input type="checkbox" checked={p.selected} onChange={(e) => patchPhoto(p.id, { selected: e.target.checked })} /> Pilih untuk album</label><label><input type="checkbox" checked={p.visible} onChange={(e) => patchPhoto(p.id, { visible: e.target.checked })} /> Tampilkan</label></div><label className="block text-sm">Judul foto<input className={field} maxLength={250} value={p.title} onChange={(e) => patchPhoto(p.id, { title: e.target.value })} /></label><label className="block text-sm">Keterangan<textarea className={field} maxLength={1000} value={p.caption} onChange={(e) => patchPhoto(p.id, { caption: e.target.value })} /></label><label className="block text-sm">Teks alternatif<input className={field} maxLength={500} value={p.alt} onChange={(e) => patchPhoto(p.id, { alt: e.target.value })} /></label></div></div>
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Ukuran<select className={field} value={p.size} onChange={(e) => patchPhoto(p.id, { size: e.target.value as GalleryPhoto['size'] })}><option value="small">Kecil</option><option value="medium">Sedang</option><option value="large">Besar</option></select></label><label className="text-sm">Rasio<select className={field} value={p.ratio} onChange={(e) => patchPhoto(p.id, { ratio: e.target.value as GalleryPhoto['ratio'] })}><option value="original">Asli (utuh di Masonry)</option><option value="landscape">Landscape</option><option value="portrait">Portrait</option><option value="square">Kotak</option></select></label></div>
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={p.crop} onChange={(e) => patchPhoto(p.id, { crop: e.target.checked })} /> Crop untuk mengisi rasio (foto asli di Drive tidak diubah)</label>{p.crop && <div className="grid gap-3 sm:grid-cols-2">{(['focalX', 'focalY'] as const).map((axis) => <label key={axis} className="text-xs">Titik fokus {axis === 'focalX' ? 'horizontal' : 'vertikal'} ({p[axis]}%)<input type="range" className="mt-2 w-full" min={0} max={100} value={p[axis]} onChange={(e) => patchPhoto(p.id, { [axis]: Number(e.target.value) })} /></label>)}</div>}
          <div className="flex flex-wrap gap-3"><button type="button" className="btn-secondary" disabled={index === 0} onClick={() => move(index, -1)}>Naik</button><button type="button" className="btn-secondary" disabled={index === form.photos.length - 1} onClick={() => move(index, 1)}>Turun</button><button type="button" className="text-sm text-red-700" onClick={() => { if (confirm('Hapus dari album website saja? Berkas di Google Drive tetap ada.')) setForm({ ...form, photos: form.photos.filter((photo) => photo.id !== p.id) }); }}>Hapus dari album</button></div>
        </article>)}</section>
        <section className="space-y-4 border bg-white p-4"><div className="flex flex-wrap gap-3"><button type="button" className="btn-primary" onClick={() => submit('draft')}>Simpan Draft</button><button type="button" className="btn-secondary" onClick={() => setPreview(!preview)}>Pratinjau</button><button type="button" className="btn-primary" onClick={() => submit('publish')}>{album?.status === 'archived' ? 'Pulihkan & Terbitkan' : 'Terbitkan'}</button>{album && <button type="button" className="text-sm text-red-700" onClick={() => { if (confirm('Arsipkan album website? Foto di Google Drive tidak dihapus.')) submit('archive'); }}>Arsipkan album</button>}{album?.status === 'published' && <Link className="text-sm text-emerald-forest underline" target="_blank" href={`/media/galeri/${album.slug}`}>Lihat terbitan</Link>}</div>{preview && <div data-gallery-preview className="space-y-4 border-t pt-4"><p className="text-xs text-amber-800">Pratinjau privat {dirty ? '(perubahan belum disimpan)' : '(draft tersimpan)'}. Hanya foto terpilih dan tampil.</p><h2 className="font-serif text-2xl">{form.title}</h2><p className="text-sm">{form.description}</p><GalleryLightbox photos={form.photos} title={form.title} layout={form.layout} /></div>}</section>
        {!!album?.history.length && <details className="border bg-white p-4"><summary className="cursor-pointer font-semibold">Riwayat draft (20 perubahan terakhir)</summary><div className="mt-3 space-y-3">{album.history.map((v, i) => <div key={`${v.at}-${i}`} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-xs"><span>{new Date(v.at).toLocaleString('id-ID')} • Admin #{v.by} • {v.action}</span><button type="button" className="text-emerald-forest underline" onClick={() => { if (!dirty || confirm('Ganti formulir dengan riwayat ini?')) { setForm(v.data); setNotice('Versi riwayat dimuat ke formulir. Simpan draft dahulu; terbitan publik belum berubah.'); } }}>Muat ke draft</button></div>)}</div></details>}
      </fieldset>
    </div>
  </div>;
}
