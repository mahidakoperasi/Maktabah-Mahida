export const ADMIN_ACCESS = ['content', 'media', 'admissions', 'commerce'] as const;
export type AdminAccess = (typeof ADMIN_ACCESS)[number];
export type StoredAdminAccess = AdminAccess | 'full';

export const ADMIN_ACCESS_LABEL: Record<AdminAccess, string> = {
  content: 'Pengelola Konten',
  media: 'Media & Galeri',
  admissions: 'Pendaftaran',
  commerce: 'Koperasi',
};

export function isAdminAccess(value: unknown): value is AdminAccess {
  return typeof value === 'string' && (ADMIN_ACCESS as readonly string[]).includes(value);
}

export function canAccess(
  access: StoredAdminAccess | null | undefined,
  required: AdminAccess | 'primary',
  isPrimary = false,
) {
  if (isPrimary || access === 'full') return true;
  return required !== 'primary' && access === required;
}
