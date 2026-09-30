import HomepageSettingsForm from '@/components/admin/HomepageSettingsForm';

export default async function HomepageAdminPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <p className="label mb-2">Tampilan Website</p>
        <h1 className="text-3xl font-serif font-bold text-charcoal">Beranda</h1>
        <p className="mt-2 text-sm text-warm-gray-500">
          Kendalikan konten utama homepage tanpa mengubah source code.
        </p>
      </div>

      <HomepageSettingsForm />
    </div>
  );
}
