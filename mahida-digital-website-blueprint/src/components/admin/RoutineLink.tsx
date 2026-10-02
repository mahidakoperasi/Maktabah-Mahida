import Link from 'next/link';
export default function RoutineLink() {
  return (
    <p className="text-sm">
      <Link href="/admin/pengelolaan" className="underline">
        Periksa kualitas, checklist dan panduan sebelum terbit →
      </Link>
    </p>
  );
}
