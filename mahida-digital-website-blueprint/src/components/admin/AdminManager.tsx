'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, Plus, ShieldCheck, Trash2, UserCog } from 'lucide-react';

type AdminItem = {
  id: number;
  name: string;
  email: string;
  createdAt: string | null;
  isPrimary: boolean;
};

export default function AdminManager() {
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadAdmins() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/admins', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal memuat admin.');
      setAdmins(data.admins || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat admin.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  async function addAdmin(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Gagal menambahkan admin.');

      setName('');
      setEmail('');
      setPassword('');
      setNotice('Admin baru berhasil ditambahkan.');
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan admin.');
    } finally {
      setSaving(false);
    }
  }

  async function revokeAdmin(admin: AdminItem) {
    if (admin.isPrimary) return;
    if (!window.confirm(`Cabut akses admin dari ${admin.name} (${admin.email})?`)) return;

    setError('');
    setNotice('');

    try {
      const response = await fetch(`/api/admin/admins/${admin.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Gagal mencabut akses admin.');

      setNotice('Akses admin berhasil dicabut.');
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mencabut akses admin.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="label mb-2">Keamanan</p>
        <h1 className="font-serif text-3xl font-bold text-charcoal">Kelola Admin</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-warm-gray-500">
          Hanya admin utama yang dapat menambahkan atau mencabut akses admin. Tidak ada pendaftaran admin dari halaman publik.
        </p>
      </div>

      {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="border border-warm-gray-200 bg-white">
          <div className="flex items-center gap-3 border-b border-warm-gray-200 p-5">
            <UserCog size={20} className="text-emerald-forest" />
            <div>
              <h2 className="font-semibold text-charcoal">Admin Aktif</h2>
              <p className="text-xs text-warm-gray-500">{admins.length} akun memiliki akses admin</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-warm-gray-500">
              <Loader2 size={16} className="animate-spin" /> Memuat admin...
            </div>
          ) : (
            <div className="divide-y divide-warm-gray-100">
              {admins.map((admin) => (
                <div key={admin.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-charcoal">{admin.name}</p>
                      {admin.isPrimary && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                          <ShieldCheck size={12} /> Admin Utama
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-warm-gray-500">{admin.email}</p>
                  </div>

                  {admin.isPrimary ? (
                    <span className="text-xs font-medium text-warm-gray-400">Dilindungi</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => revokeAdmin(admin)}
                      className="inline-flex items-center gap-2 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={14} /> Cabut Akses
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="border border-warm-gray-200 bg-white p-5">
          <div className="mb-5 flex items-center gap-3">
            <Plus size={19} className="text-emerald-forest" />
            <h2 className="font-semibold text-charcoal">Tambah Admin</h2>
          </div>

          <form onSubmit={addAdmin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-warm-gray-600">Nama</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-warm-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-forest"
                placeholder="Nama admin"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-warm-gray-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-warm-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-forest"
                placeholder="admin@email.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-warm-gray-600">Password Awal</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full border border-warm-gray-300 px-3 py-2.5 pr-10 text-sm outline-none focus:border-emerald-forest"
                  placeholder="Minimal 8 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray-400"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full justify-center disabled:opacity-60">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Plus size={16} /> Tambah Admin</>}
            </button>
          </form>

          <p className="mt-4 text-xs leading-relaxed text-warm-gray-400">
            Berikan password awal secara langsung kepada admin baru. Admin tidak perlu OTP atau verifikasi email untuk masuk.
          </p>
        </aside>
      </div>
    </div>
  );
}
