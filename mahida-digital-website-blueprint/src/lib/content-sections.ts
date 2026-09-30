export const contentSections = {
  esai: { label: 'Esai & Opini', type: 'essay', category: null, publicPath: '/karya/esai' },
  terjemahan: { label: 'Terjemahan', type: 'work', category: 'terjemahan', publicPath: '/karya/terjemahan' },
  manuskrip: { label: 'Manuskrip', type: 'work', category: 'manuskrip', publicPath: '/karya/manuskrip' },
  berita: { label: 'Berita', type: 'news', category: null, publicPath: '/media/berita' },
  kegiatan: { label: 'Kegiatan', type: 'story', category: null, publicPath: '/media/kegiatan' },
  pengumuman: { label: 'Pengumuman', type: 'announcement', category: null, publicPath: '/media/pengumuman' },
} as const;

export type ContentSection = keyof typeof contentSections;
export function isContentSection(value: string): value is ContentSection {
  return Object.hasOwn(contentSections, value);
}
