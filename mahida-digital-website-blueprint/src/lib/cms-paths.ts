// Pure route validation shared by CMS and the visual editor.
export function validCmsPath(path: string) {
  return (
    path === '/' ||
    (/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*)(?:\/[a-z0-9]+(?:-[a-z0-9]+)*){0,3}$/.test(
      path,
    ) &&
      !/^\/(?:admin|api|masuk|daftar)(?:\/|$)/.test(path) &&
      !/^\/literasi\/artikel(?:\/|$)/.test(path))
  );
}
export function validNewCmsPath(path: string) {
  if (!validCmsPath(path) || path === '/') return false;
  const [, first, second] = path.split('/');
  if (
    [
      'literasi',
      'maktabah',
      'profil',
      'agenda',
      'arsip',
      'berita',
      'kegiatan',
      'kirim-karya',
    ].includes(first)
  )
    return false;
  if (
    first === 'karya' &&
    ['artikel', 'esai', 'terjemahan', 'manuskrip'].includes(second)
  )
    return false;
  if (
    first === 'media' &&
    ['berita', 'kegiatan', 'pengumuman', 'video', 'galeri', 'tv'].includes(
      second,
    )
  )
    return false;
  if (first === 'koperasi' && ['buku', 'ebook'].includes(second)) return false;
  return true;
}
