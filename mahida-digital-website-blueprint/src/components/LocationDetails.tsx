import type { PageContent } from '@/lib/design-schema';
export default function LocationDetails({
  content,
}: {
  content: PageContent | null;
}) {
  return content &&
    (content.address ||
      content.mapsUrl ||
      content.mapEmbed ||
      content.serviceHours) ? (
    <section className="space-y-4" aria-label="Alamat dan layanan">
      {content.address && (
        <p className="whitespace-pre-line">{content.address}</p>
      )}
      {content.mapsUrl && (
        <a
          href={content.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          Buka di Maps
        </a>
      )}
      {content.serviceHours && (
        <div>
          <h2 className="font-bold">Jam Layanan</h2>
          <p className="whitespace-pre-line">{content.serviceHours}</p>
        </div>
      )}
      {content.mapEmbed && (
        <iframe
          loading="lazy"
          src={content.mapEmbed}
          title="Lokasi Mahida"
          className="h-80 w-full border-0"
          referrerPolicy="no-referrer"
        />
      )}
    </section>
  ) : null;
}
