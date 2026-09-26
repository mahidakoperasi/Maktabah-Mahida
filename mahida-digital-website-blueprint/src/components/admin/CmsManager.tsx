'use client';

import { useEffect, useState } from 'react';

type Page = { id: number; path: string; title: string; intro: string | null; body: string | null; status: string; isSystem: boolean };
type Menu = { id: number; parentId: number | null; path: string; label: string; sortOrder: number; isVisible: boolean };
const emptyPage = { path: '/halaman-baru', title: '', intro: '', body: '', status: 'draft' };
const emptyMenu = { path: '', label: '', parentId: null as number | null, sortOrder: 0, isVisible: true };

export default function CmsManager() {
  const [pages, setPages] = useState<Page[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [pageForm, setPageForm] = useState<{ id?: number; path: string; title: string; intro: string; body: string; status: string }>(emptyPage);
  const [menuForm, setMenuForm] = useState<{ id?: number; path: string; label: string; parentId: number | null; sortOrder: number; isVisible: boolean }>(emptyMenu);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const [p, m] = await Promise.all([
      fetch('/api/admin/cms/pages', { cache: 'no-store' }),
      fetch('/api/admin/cms/navigation', { cache: 'no-store' }),
    ]);
    if (!p.ok || !m.ok) throw new Error('Gagal memuat halaman atau menu');
    setPages((await p.json()).pages);
    setMenus((await m.json()).items);
  }
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/admin/cms/pages', { cache: 'no-store' }),
      fetch('/api/admin/cms/navigation', { cache: 'no-store' }),
    ]).then(async ([p, m]) => {
      if (!p.ok || !m.ok) throw new Error('Gagal memuat halaman atau menu');
      const [pageData, menuData] = await Promise.all([p.json(), m.json()]);
      if (active) { setPages(pageData.pages); setMenus(menuData.items); }
    }).catch((err) => { if (active) setMessage(err.message); });
    return () => { active = false; };
  }, []);

  async function submit(kind: 'pages' | 'navigation', payload: unknown, method: string) {
    setSaving(true); setMessage('');
    try {
      const response = await fetch(`/api/admin/cms/${kind}`, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Gagal menyimpan');
      await load();
      setMessage('Perubahan disimpan. Muat ulang halaman publik untuk melihat hasilnya.');
      if (method === 'POST' || method === 'DELETE') kind === 'pages' ? setPageForm(emptyPage) : setMenuForm(emptyMenu);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-10">
      <div><h1 className="font-serif text-3xl font-bold">Halaman &amp; Navigasi</h1><p className="mt-2 text-sm text-warm-gray-600">Halaman terbit tanpa isi menampilkan pesan kosong. Sembunyikan menu tanpa menghapus halamannya.</p></div>
      {message && <p role="status" className="border border-mahida-200 bg-white p-3 text-sm">{message}</p>}
      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-2"><h2 className="font-serif text-xl font-bold">Halaman</h2>
          {pages.map((page) => <button key={page.id} type="button" onClick={() => setPageForm({ id: page.id, path: page.path, title: page.title, intro: page.intro ?? '', body: page.body ?? '', status: page.status })} className="block w-full border border-mahida-200 bg-white p-3 text-left text-sm hover:bg-mahida-50">{page.title} <span className="text-warm-gray-500">{page.path} · {page.status}</span></button>)}
        </div>
        <form className="space-y-3 border border-mahida-200 bg-white p-5" onSubmit={(event) => { event.preventDefault(); submit('pages', pageForm, pageForm.id ? 'PATCH' : 'POST'); }}>
          <h3 className="font-semibold">{pageForm.id ? 'Edit halaman' : 'Halaman baru'}</h3>
          <label className="block text-sm">URL<input required value={pageForm.path} onChange={(event) => setPageForm({ ...pageForm, path: event.target.value })} className="mt-1 w-full border p-2" placeholder="/halaman-baru" /></label>
          <label className="block text-sm">Judul<input required value={pageForm.title} onChange={(event) => setPageForm({ ...pageForm, title: event.target.value })} className="mt-1 w-full border p-2" /></label>
          <label className="block text-sm">Pengantar<textarea value={pageForm.intro} onChange={(event) => setPageForm({ ...pageForm, intro: event.target.value })} className="mt-1 w-full border p-2" rows={3} /></label>
          <label className="block text-sm">Isi<textarea value={pageForm.body} onChange={(event) => setPageForm({ ...pageForm, body: event.target.value })} className="mt-1 w-full border p-2" rows={8} /></label>
          <label className="block text-sm">Status<select value={pageForm.status} onChange={(event) => setPageForm({ ...pageForm, status: event.target.value })} className="mt-1 w-full border p-2"><option value="draft">Draft</option><option value="published">Terbit</option></select></label>
          <div className="flex flex-wrap gap-3"><button disabled={saving} className="btn-primary" type="submit">Simpan halaman</button><button type="button" className="btn-secondary" onClick={() => setPageForm(emptyPage)}>Halaman baru</button>{pageForm.id && !pages.find((p) => p.id === pageForm.id)?.isSystem && <button type="button" disabled={saving} className="text-red-700" onClick={() => { if (confirm('Hapus halaman ini?')) submit('pages', { id: pageForm.id }, 'DELETE'); }}>Hapus</button>}</div>
        </form>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-2"><h2 className="font-serif text-xl font-bold">Menu publik</h2>
          {menus.map((menu) => <button key={menu.id} type="button" onClick={() => setMenuForm(menu)} className="block w-full border border-mahida-200 bg-white p-3 text-left text-sm hover:bg-mahida-50">{menu.parentId ? '↳ ' : ''}{menu.label} <span className="text-warm-gray-500">{menu.path} · {menu.isVisible ? 'Tampil' : 'Sembunyi'}</span></button>)}
        </div>
        <form className="space-y-3 border border-mahida-200 bg-white p-5" onSubmit={(event) => { event.preventDefault(); submit('navigation', menuForm, menuForm.id ? 'PATCH' : 'POST'); }}>
          <h3 className="font-semibold">{menuForm.id ? 'Edit menu' : 'Menu baru'}</h3>
          <label className="block text-sm">Label<input required value={menuForm.label} onChange={(event) => setMenuForm({ ...menuForm, label: event.target.value })} className="mt-1 w-full border p-2" /></label>
          <label className="block text-sm">Halaman tujuan<select required value={menuForm.path} onChange={(event) => setMenuForm({ ...menuForm, path: event.target.value })} className="mt-1 w-full border p-2"><option value="">Pilih halaman</option>{pages.map((page) => <option key={page.id} value={page.path}>{page.path} — {page.title}</option>)}</select></label>
          <label className="block text-sm">Di bawah menu<select value={menuForm.parentId ?? ''} onChange={(event) => setMenuForm({ ...menuForm, parentId: event.target.value ? Number(event.target.value) : null })} className="mt-1 w-full border p-2"><option value="">Menu utama</option>{menus.filter((m) => m.parentId === null && m.id !== menuForm.id).map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
          <label className="block text-sm">Urutan<input type="number" min="0" value={menuForm.sortOrder} onChange={(event) => setMenuForm({ ...menuForm, sortOrder: Number(event.target.value) })} className="mt-1 w-full border p-2" /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={menuForm.isVisible} onChange={(event) => setMenuForm({ ...menuForm, isVisible: event.target.checked })} /> Tampilkan di website</label>
          <div className="flex flex-wrap gap-3"><button disabled={saving} className="btn-primary" type="submit">Simpan menu</button><button type="button" className="btn-secondary" onClick={() => setMenuForm(emptyMenu)}>Menu baru</button>{menuForm.id && <button type="button" disabled={saving} className="text-red-700" onClick={() => { if (confirm('Hapus menu ini?')) submit('navigation', { id: menuForm.id }, 'DELETE'); }}>Hapus</button>}</div>
        </form>
      </section>
    </div>
  );
}
