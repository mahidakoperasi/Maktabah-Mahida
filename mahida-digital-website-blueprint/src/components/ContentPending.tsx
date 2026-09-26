type ContentPendingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

export default function ContentPending({
  eyebrow,
  title,
  description,
  emptyTitle = 'Belum ada konten terbit',
  emptyDescription = 'Konten resmi akan ditampilkan di halaman ini setelah tersedia.',
}: ContentPendingProps) {
  return (
    <>
      <section className="bg-emerald-forest py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="label mb-3 !text-white/70">{eyebrow}</p>
          <h1 className="display-md text-white">{title}</h1>
          {description && <p className="mt-4 max-w-2xl text-white/80">{description}</p>}
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="border border-mahida-200 bg-white p-8 sm:p-10">
          <h2 className="font-serif text-xl font-bold text-charcoal">{emptyTitle}</h2>
          <p className="mt-2 text-sm text-warm-gray-600">{emptyDescription}</p>
        </div>
      </section>
    </>
  );
}
