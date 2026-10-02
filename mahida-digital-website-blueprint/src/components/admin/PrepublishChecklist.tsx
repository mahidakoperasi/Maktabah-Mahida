'use client';
import { checklistLabels, type Checklist } from '@/lib/quality-schema';
export default function PrepublishChecklist({
  value,
  onChange,
}: {
  value: Checklist;
  onChange: (next: Checklist) => void;
}) {
  return (
    <section
      aria-label="Checklist sebelum terbit"
      className="space-y-3 border bg-white p-4"
    >
      <h2 className="text-xl font-bold">Checklist sebelum terbit</h2>
      <p className="text-sm">
        Centang setelah ditinjau. Perubahan isi akan mengosongkan checklist agar
        versi terbaru diperiksa kembali.
      </p>
      {Object.entries(checklistLabels).map(([key, label]) => (
        <label key={key} className="flex min-h-11 items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0"
            checked={value[key as keyof Checklist]}
            onChange={(e) => onChange({ ...value, [key]: e.target.checked })}
          />
          <span>{label}</span>
        </label>
      ))}
    </section>
  );
}
