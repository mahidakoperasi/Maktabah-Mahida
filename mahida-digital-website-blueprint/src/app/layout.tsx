import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Mahida Digital — Belajar. Berkarya. Berkhidmah.",
    template: "%s | Mahida Digital",
  },
  description: "Website resmi, media, literasi, arsip, dan ekosistem Mahida. Satu ruang untuk mengenal, membaca, melihat, menjaga, dan mengikuti perjalanan Mahida.",
  keywords: ["Mahida", "pesantren", "pondok pesantren", "literasi", "kitab", "karya", "maktabah"],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Mahida Digital",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Lora:wght@400;500;600;700&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="bg-cream text-charcoal antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="min-w-0 flex-1 pt-[76px]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
