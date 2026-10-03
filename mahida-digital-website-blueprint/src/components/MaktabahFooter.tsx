import Link from "next/link";
import type { LibrarySettings } from "@/lib/maktabah-schema";
import { EMPTY_PUBLIC_DIRECTORY } from "@/lib/public-directory";
import {
  getVisibleDirectory,
  visibleDirectory,
} from "@/lib/public-directory-store";
import { socialIcons, contactIcons } from "./PublicDirectoryLinks";
import ArabicText from "./ArabicText";

export default async function MaktabahFooter({
  settings,
}: {
  settings: LibrarySettings;
}) {
  const f = settings.footer;
  if (!f.enabled) return null;
  const directory =
    f.source === "mahida"
      ? await getVisibleDirectory()
      : visibleDirectory(
          {
            ...EMPTY_PUBLIC_DIRECTORY,
            socials: f.socials,
            contacts: f.contacts,
          },
          "",
        );
  const sections = f.groups.filter(
    (group) =>
      group.visible &&
      (group.id === "socials"
        ? directory.socials.length > 0
        : group.id === "contacts"
          ? directory.contacts.length > 0 || Boolean(f.address)
          : Boolean(
              f.joinTitle || f.joinDescription || (f.joinLabel && f.joinUrl),
            )),
  );
  if (!sections.length) return null;
  return (
    <footer className="library-footer" aria-label="Footer Maktabah">
      <div className="library-footer-inner">
        {sections.map(({ id }) => (
          <section key={id} className={`library-footer-${id}`}>
            {f[`${id}Title`] && (
              <h2 dir="auto">
                <ArabicText text={f[`${id}Title`]} />
              </h2>
            )}
            {id === "socials" && (
              <ul className="library-social-links">
                {directory.socials.map((item) => {
                  const Icon = socialIcons[item.platform];
                  return (
                    <li key={item.id}>
                      <a
                        href={item.url}
                        aria-label={item.label}
                        title={item.label}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icon aria-hidden={true} className="h-5 w-5" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
            {id === "contacts" && (
              <>
                <ul className="library-contact-links">
                  {directory.contacts.map((item) => {
                    const Icon = contactIcons[item.channel];
                    return (
                      <li key={item.id}>
                        <a
                          href={item.href}
                          {...(item.href.startsWith("https://")
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                        >
                          <Icon aria-hidden={true} className="h-4 w-4" />
                          <span dir="auto">
                            <ArabicText text={item.label} />
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
                {f.address && (
                  <p dir="auto" className="library-footer-address">
                    <ArabicText text={f.address} />
                  </p>
                )}
              </>
            )}
            {id === "join" && (
              <>
                {f.joinDescription && (
                  <p dir="auto">
                    <ArabicText text={f.joinDescription} />
                  </p>
                )}
                {f.joinLabel && f.joinUrl && (
                  <Link
                    href={f.joinUrl}
                    className="library-footer-join-button"
                    {...(f.joinUrl.startsWith("https://")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    <ArabicText text={f.joinLabel} />
                  </Link>
                )}
              </>
            )}
          </section>
        ))}
      </div>
    </footer>
  );
}
