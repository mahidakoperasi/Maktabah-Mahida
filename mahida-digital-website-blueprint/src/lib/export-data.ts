export const exportKinds = {
  gallery: { label: 'Galeri, foto, kandidat dan draf', scope: 'media' },
  content: { label: 'Artikel, karya, berita dan pengumuman', scope: 'content' },
  pages: { label: 'Halaman CMS, kliping dan draf terkait', scope: 'primary' },
  forms: { label: 'Pesan formulir kontak (data pribadi)', scope: 'primary' },
  admissions: { label: 'Pengaturan formulir pendaftaran', scope: 'admissions' },
  orders: { label: 'Pesanan E-Book (data pribadi)', scope: 'commerce' },
  analytics: { label: 'Statistik anonim harian', scope: 'primary' },
} as const;
export type ExportKind = keyof typeof exportKinds;
export function csvCell(value: unknown) {
  let text =
    value == null
      ? ''
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);
  // Neutralize spreadsheet formulas, including those hidden after whitespace.
  if (/^[\s\uFEFF]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text))
    text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function asCsv(rows: Record<string, unknown>[], columns: string[]) {
  return (
    '\uFEFF' +
    [
      columns.map(csvCell).join(','),
      ...rows.map((row) => columns.map((k) => csvCell(row[k])).join(',')),
    ].join('\r\n') +
    '\r\n'
  );
}
