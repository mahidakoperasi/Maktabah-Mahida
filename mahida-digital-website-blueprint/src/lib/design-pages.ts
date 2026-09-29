export const educationUnits = [
  { slug: 'madrasah-diniyyah', name: 'Madrasah Diniyyah Mahida Salam', level: 'Madrasah Diniyyah' },
  { slug: 'madrasah-al-quran', name: "Madrasah Al-Qur'an Mahida Salam", level: "Madrasah Al-Qur'an" },
  { slug: 'madrasah-tsanawiyah', name: 'Madrasah Tsanawiyah Mahida Salam', level: 'MTs' },
  { slug: 'madrasah-aliyyah', name: 'Madrasah Aliyyah Mahida Salam', level: 'MA' },
  { slug: 'unu-blitar', name: "Universitas Nahdlatul Ulama' Blitar di Mahida Salam", level: 'Perguruan Tinggi' },
] as const;

export const unitHref = (slug: string) => `/tentang/unit-pendidikan/${slug}`;
