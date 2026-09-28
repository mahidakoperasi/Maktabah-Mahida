import AuthorsManager from '@/components/admin/AuthorsManager';

export default function AuthorsAdminPage() {
  return <div className="space-y-6"><div><p className="label">Konten</p><h1 className="mt-2 font-serif text-3xl font-bold">Penulis</h1><p className="mt-2 text-sm text-warm-gray-600">Kelola identitas penulis dan arsip karyanya.</p></div><AuthorsManager /></div>;
}
