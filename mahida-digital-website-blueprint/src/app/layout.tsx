import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mahida Digital | Belajar • Berkarya • Berkhidmah",
  description:
    "Wajah digital resmi Mahida. Ruang literasi, pusat media, maktabah digital, arsip hidup, dan pintu menuju ekosistem Mahida.",
  keywords: [
    "Mahida",
    "Pesantren",
    "Literasi",
    "Maktabah",
    "Karya",
    "Media",
    "Digital",
  ],
  authors: [{ name: "Mahida" }],
  creator: "Mahida",
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://mahida.ac.id",
    siteName: "Mahida Digital",
    title: "Mahida Digital | Belajar • Berkarya • Berkhidmah",
    description:
      "Wajah digital resmi Mahida. Ruang literasi, pusat media, maktabah digital, arsip hidup.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        {children}
      </body>
    </html>
  );
}
