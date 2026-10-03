"use client";

import { useState } from "react";
import { publicImageUrl } from "@/lib/media-links";

function PreviewImage({ src, label }: { src: string; label: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="mt-3 flex min-h-36 items-center justify-center overflow-hidden rounded border border-mahida-200 bg-mahida-50 p-2">
      {failed ? (
        <p role="alert" className="p-3 text-sm text-red-700">
          Gambar tidak dapat ditampilkan. Periksa tautan dan atur akses Drive:
          siapa saja yang memiliki tautan dapat melihat.
        </p>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={label}
          className="max-h-56 max-w-full object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

export default function ImageUrlPreview({
  url,
  label = "Pratinjau gambar sebelum disimpan",
}: {
  url: string;
  label?: string;
}) {
  if (!url.trim()) return null;
  const src = publicImageUrl(url);
  if (!src)
    return (
      <p role="alert" className="mt-2 text-sm text-red-700">
        Gunakan tautan gambar HTTPS atau berkas Google Drive.
      </p>
    );
  return (
    <>
      <PreviewImage key={src} src={src} label={label} />
      <p className="mt-1 text-xs text-warm-gray-500">
        Pastikan gambar juga dapat dibuka melalui jendela samaran tanpa masuk ke
        akun Drive.
      </p>
    </>
  );
}
