import Link from 'next/link';
import { ArrowUpRight, Megaphone } from 'lucide-react';
import { getPromotionSettings } from '@/lib/promotion-store';
import { promotionHref, spmbBannerPromotion } from '@/lib/promotion-schema';

export default async function SpmbBanner() {
  const { published } = await getPromotionSettings();
  const campaign = spmbBannerPromotion(published);
  const href = campaign && promotionHref(campaign.buttonUrl);
  if (!campaign || !href) return null;

  const label = campaign.buttonLabel || 'Daftar Sekarang';
  const external = !href.startsWith('/');
  const linkClass =
    'motion-button inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#e4c72f] px-5 py-2.5 text-sm font-bold text-[#123d2b] transition hover:bg-[#f4dc69] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

  return (
    <section aria-label="Informasi SPMB Mahida" className="bg-[#103d2d] text-white">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8 lg:px-12">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-[#e4c72f]">
            <Megaphone aria-hidden="true" size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#e4c72f]">
              Pendaftaran santri baru
            </p>
            <h2 className="mt-1 break-words text-base font-bold leading-snug sm:text-lg">
              {campaign.title}
            </h2>
          </div>
        </div>
        {external ? (
          <a href={href} target="_blank" rel="noopener noreferrer" data-analytics-action="spmb-banner" className={linkClass}>
            {label} <ArrowUpRight aria-hidden="true" size={17} />
          </a>
        ) : (
          <Link href={href} data-analytics-action="spmb-banner" className={linkClass}>
            {label} <ArrowUpRight aria-hidden="true" size={17} />
          </Link>
        )}
      </div>
    </section>
  );
}
