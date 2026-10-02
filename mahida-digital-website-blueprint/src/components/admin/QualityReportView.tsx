import type { QualityReport } from '@/lib/quality-schema';
export default function QualityReportView({
  report,
  stale = false,
}: {
  report: QualityReport;
  stale?: boolean;
}) {
  return (
    <section
      aria-label="Hasil pemeriksaan"
      className="min-w-0 space-y-3 border bg-white p-4"
    >
      <h2 className="text-xl font-bold">Hasil pemeriksaan</h2>
      <p className="text-sm">
        {report.counts.errors} masalah • {report.counts.warnings} peringatan •{' '}
        {report.checked}/{report.total} tautan/media diperiksa
      </p>
      <p className="text-xs">
        Diperiksa:{' '}
        {new Date(report.checkedAt).toLocaleString('id-ID', {
          timeZone: 'Asia/Jakarta',
        })}{' '}
        WIB • Versi {report.version === 'draft' ? 'draf' : 'terbit'}
      </p>
      {stale && (
        <p
          role="alert"
          className="border border-amber-300 bg-amber-50 p-3 text-sm"
        >
          Isi berubah sejak pemeriksaan ini. Jalankan pemeriksaan ulang sebelum
          memakai hasilnya.
        </p>
      )}
      <ul className="space-y-3">
        {report.issues.map((item, i) => (
          <li
            key={i}
            className={`min-w-0 border-l-4 p-3 text-sm ${item.severity === 'error' ? 'border-red-500 bg-red-50' : item.severity === 'warning' ? 'border-amber-400 bg-amber-50' : 'border-mahida-200 bg-mahida-50'}`}
          >
            <strong>
              {item.severity === 'error'
                ? 'Masalah'
                : item.severity === 'warning'
                  ? 'Peringatan'
                  : 'Catatan'}{' '}
              — {item.label}
            </strong>
            <p>{item.message}</p>
            {item.url && <p className="mt-1 break-all text-xs">{item.url}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
