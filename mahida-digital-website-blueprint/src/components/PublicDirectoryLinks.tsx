import {
  AtSign, Camera, Globe, Mail, MessageCircle, Music2, Phone, Play, 
  type LucideIcon,
} from 'lucide-react';
import type { SocialLink } from '@/lib/public-directory';
import type { PublicContact } from '@/lib/public-directory-store';

function FacebookIcon({ className }: { className?: string; 'aria-hidden'?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M14.3 21v-8.2H17l.4-3.2h-3.1V7.5c0-.9.3-1.5 1.6-1.5h1.7V3.1c-.3 0-1.3-.1-2.5-.1-2.6 0-4.3 1.6-4.3 4.5v2.1H8v3.2h2.8V21h3.5Z" />
  </svg>;
}

const socialIcons: Record<SocialLink['platform'], LucideIcon | typeof FacebookIcon> = {
  instagram: Camera, youtube: Play, facebook: FacebookIcon,
  tiktok: Music2, x: AtSign, lainnya: Globe,
};
const contactIcons: Record<PublicContact['channel'], LucideIcon> = {
  whatsapp: MessageCircle, telepon: Phone, email: Mail, website: Globe,
};

export default function PublicDirectoryLinks({
  socials, contacts, variant = 'page',
}: {
  socials: SocialLink[];
  contacts: PublicContact[];
  variant?: 'page' | 'footer';
}) {
  const footer = variant === 'footer';
  const linkClass = footer
    ? 'flex items-center gap-2 text-sm text-white/75 hover:text-white'
    : 'flex min-w-0 items-center gap-3 rounded border border-mahida-200 bg-white px-4 py-3 text-emerald-forest hover:border-emerald-forest';
  const groups = [
    { title: 'Kontak', entries: contacts.map((item) => ({ ...item, Icon: contactIcons[item.channel] })) },
    { title: 'Media sosial', entries: socials.map((item) => ({
      id: item.id, label: item.label, href: item.url, Icon: socialIcons[item.platform],
    })) },
  ];

  return (
    <div className={footer ? 'mt-10 grid gap-8 border-t border-white/15 pt-8 sm:grid-cols-2' : 'grid gap-10 sm:grid-cols-2'}>
      {groups.filter((group) => group.entries.length).map((group) => (
        <section key={group.title} aria-label={group.title}>
          <h2 className={footer ? 'mb-4 font-semibold text-[#f0d43b]' : 'mb-4 font-serif text-2xl font-bold text-emerald-forest'}>{group.title}</h2>
          <ul className="space-y-3">
            {group.entries.map(({ id, label, href, Icon }) => (
              <li key={id}>
                <a href={href} className={linkClass} {...(href.startsWith('https://') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                  <Icon aria-hidden={true} className="h-5 w-5 shrink-0" />
                  <span className="break-words">{label}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
