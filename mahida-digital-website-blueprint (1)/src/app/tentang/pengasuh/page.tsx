import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pengasuh',
  description: 'Mengenal para pengasuh dan pemimpin Pondok Pesantren Mahida.',
};

const pengasuhList = [
  {
    name: 'Kyai (Nama Pengasuh)',
    role: 'Pengasuh Ponpes Mahida',
    description: 'Memimpin dan membimbing perjalanan Pondok Pesantren Mahida sejak awal berdiri. Berkomitmen pada pendidikan Islam yang mengakar pada tradisi namun terbuka terhadap perkembangan.',
    expertise: ['Ilmu Hadits', 'Tasawuf', 'Pendidikan Islam'],
  },
  {
    name: '(Nama Pengasuh II)',
    role: 'Wakil Pengasuh Bidang Kurikulum',
    description: 'Bertanggung jawab mengembangkan kurikulum yang memadukan ilmu agama dan pengetahuan umum dengan pendekatan pesantren.',
    expertise: ['Nahwu-Sharaf', 'Metodologi Pembelajaran', 'Kurikulum'],
  },
];

export default function PengasuhPage() {
  return (
    <>
      <section className="bg-emerald-forest text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="label text-brass-light mb-3">Tentang → Pengasuh</p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold">Para Pengasuh</h1>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Intro */}
          <div className="max-w-2xl mb-12">
            <p className="text-lg text-warm-gray-600 leading-relaxed">
              Para pengasuh adalah ruh dari kehidupan pondok. Mereka bukan hanya mengajar, 
              tetapi juga membina, mendidik, dan menjadi teladan bagi seluruh santri.
            </p>
          </div>

          {/* Pengasuh Cards */}
          <div className="space-y-10">
            {pengasuhList.map((pengasuh) => (
              <article key={pengasuh.name} className="flex flex-col md:flex-row gap-8 pb-10 border-b border-mahida-200 last:border-0 last:pb-0">
                {/* Photo placeholder */}
                <div className="flex-shrink-0 mx-auto md:mx-0">
                  <div className="w-40 h-48 bg-mahida-100 rounded-sm overflow-hidden flex items-center justify-center">
                    <span className="text-mahida-400 font-serif text-xl text-center px-2">{pengasuh.name.charAt(0)}</span>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-serif font-bold text-charcoal mb-1">{pengasuh.name}</h2>
                  <p className="text-emerald-forest font-semibold mb-3">{pengasuh.role}</p>
                  <p className="text-warm-gray-600 leading-relaxed mb-4">{pengasuh.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {pengasuh.expertise.map((exp) => (
                      <span key={exp} className="tag-pill">{exp}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
