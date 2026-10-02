import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import PublicationFrame, { PublicationHeader } from '@/components/PublicationFrame';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PublicAnalytics from '@/components/PublicAnalytics';
import { getHomepageSettings } from '@/lib/homepage-settings';
import { publicImageUrl } from '@/lib/media-links';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getHomepageSettings();
  const icon = publicImageUrl(settings.siteLogoUrl) ?? '/brand/mahida-logo.webp';
  return {
    metadataBase: new URL('https://mahida.my.id'),
    title: { default: settings.seoTitle, template: `%s | ${settings.siteName}` },
    description: settings.seoDescription,
    icons: { icon, shortcut: icon, apple: icon },
    openGraph: { type: 'website', locale: 'id_ID', siteName: settings.siteName },
  };
}

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
        <PublicAnalytics />
        <PublicationHeader />
        <Navbar />
        <main className="min-w-0 flex-1">
          <PublicationFrame>{children}</PublicationFrame>
        </main>
        <Footer />
      </body>
    </html>
  );
}
