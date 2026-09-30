export default function MediaPlaceholder({ label = 'Gambar', className = '' }: { label?: string; className?: string }) {
  return <div role="img" aria-label={`Media belum tersedia: ${label}`} className={`grid place-items-center bg-[#dce6dc] px-4 text-center text-xs font-bold uppercase tracking-[0.12em] text-[#436350] ${className}`}>
    [MEDIA DRIVE ADMIN: {label}]
  </div>;
}
