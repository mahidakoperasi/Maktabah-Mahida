export type KaryaPost = {
  slug: string;
  type: string;
  karyaCategory: string | null;
};

export function karyaPostPath(post: KaryaPost): string | null {
  const category = post.type === 'article' ? 'artikel'
    : post.type === 'essay' ? 'esai'
    : post.type === 'work' && post.karyaCategory === 'terjemahan' ? 'terjemahan'
    : post.type === 'work' && post.karyaCategory === 'manuskrip' ? 'manuskrip'
    : null;
  return category ? `/karya/${category}/${post.slug}` : null;
}

export function karyaPostLabel(post: Pick<KaryaPost, 'type' | 'karyaCategory'>): string {
  if (post.type === 'article') return 'Artikel';
  if (post.type === 'essay') return 'Esai & Opini';
  return post.karyaCategory === 'manuskrip' ? 'Manuskrip' : 'Terjemahan';
}
