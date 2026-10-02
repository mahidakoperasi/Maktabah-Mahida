export const analyticsLabels = {
  pageview: 'Kunjungan halaman',
  whatsapp: 'Klik WhatsApp',
  admissions: 'Klik pendaftaran',
  youtube: 'Klik YouTube',
  brochure: 'Klik brosur',
  'ebook-order': 'Klik lanjut QRIS',
  'contact-submit': 'Klik kirim pesan',
  'hero-primary': 'Klik tombol utama Beranda',
  'hero-secondary': 'Klik tombol kedua Beranda',
} as const;
export type AnalyticsEvent = keyof typeof analyticsLabels;
export function validAnalyticsEvent(event: string): event is AnalyticsEvent {
  return Object.hasOwn(analyticsLabels, event);
}
