import type { ReactNode } from "react";
import SearchHighlight from "./SearchHighlight";
import VideoEmbedBlock from "./VideoEmbedBlock";
import { driveThumbnailUrl, videoEmbedFromUrl } from "@/lib/media-links";
import { safeArticleLink } from "@/lib/rich-links";

const blocks = /(\[\[(?:image|youtube|video):[^\]]+\]\])/gi;
const imageMarker =
  /^\[\[image:(https:\/\/[^\]|\s]+)(?:\|([^\]]{0,200}))?\]\]$/i;
const videoMarker =
  /^\[\[(?:youtube|video):(https:\/\/[^\]|\s]+)(?:\|([^\]]{0,200}))?\]\]$/i;

function inline(text: string, query = ""): ReactNode[] {
  return text
    .split(
      /(\[[^\]\n]{1,200}\]\(https:\/\/[^\s)]+\)|https:\/\/[^\s<>()]+|\*\*[^*\n]+\*\*|\*[^*\n]+\*|\+\+[^+\n]+\+\+)/g,
    )
    .map((part, index) => {
      const link = /^\[([^\]\n]{1,200})\]\((https:\/\/[^\s)]+)\)$/.exec(part);
      if (link) {
        const href = safeArticleLink(link[2]);
        if (href)
          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-emerald-forest underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <SearchHighlight query={query} text={link[1]} />
            </a>
          );
      }
      if (part.startsWith("https://")) {
        const address = part.replace(/[.,!?;:]+$/, "");
        const href = safeArticleLink(address);
        if (href)
          return (
            <span key={index}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-emerald-forest underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {address}
              </a>
              {part.slice(address.length)}
            </span>
          );
      }
      if (part.startsWith("**") && part.endsWith("**"))
        return (
          <strong key={index}>
            <SearchHighlight query={query} text={part.slice(2, -2)} />
          </strong>
        );
      if (part.startsWith("*") && part.endsWith("*"))
        return (
          <em key={index}>
            <SearchHighlight query={query} text={part.slice(1, -1)} />
          </em>
        );
      if (part.startsWith("++") && part.endsWith("++"))
        return (
          <u key={index}>
            <SearchHighlight query={query} text={part.slice(2, -2)} />
          </u>
        );
      return <SearchHighlight query={query} key={index} text={part} />;
    });
}

export default function RichContent({
  content,
  query = "",
}: {
  content: string;
  query?: string;
}) {
  let key = 0;
  const nodes: ReactNode[] = [];
  content.split(blocks).forEach((part) => {
    const image = imageMarker.exec(part);
    if (image) {
      const src = driveThumbnailUrl(image[1]);
      if (src)
        nodes.push(
          <figure
            key={key++}
            className="my-8 overflow-hidden border border-mahida-200 bg-white p-3 sm:p-5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={image[2]?.trim() || "Gambar dalam tulisan"}
              loading="lazy"
              className="mx-auto h-auto max-h-[700px] w-full object-contain"
            />
            {image[2]?.trim() && (
              <figcaption className="mt-3 text-center text-sm text-warm-gray-600">
                {image[2].trim()}
              </figcaption>
            )}
          </figure>,
        );
      return;
    }
    const video = videoMarker.exec(part);
    if (video) {
      const embed = videoEmbedFromUrl(video[1]);
      if (embed)
        nodes.push(
          <VideoEmbedBlock
            key={key++}
            video={embed}
            label={video[2]?.trim()}
          />,
        );
      return;
    }
    part
      .split(/\n\s*\n/)
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((paragraph) => {
        const lines = paragraph
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        const heading = /^(#{2,3})\s+(.+)$/.exec(paragraph);
        if (
          lines.length >= 2 &&
          lines[0].startsWith("|") &&
          /^\|[\s:|\-]+\|$/.test(lines[1])
        ) {
          const cells = (line: string) =>
            line
              .replace(/^\||\|$/g, "")
              .split("|")
              .map((cell) => cell.trim());
          nodes.push(
            <div
              key={key++}
              className="kitab-table-scroll"
              tabIndex={0}
              aria-label="Tabel"
            >
              <table>
                <thead>
                  <tr>
                    {cells(lines[0]).map((cell, i) => (
                      <th key={i} dir="auto">
                        {inline(cell, query)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.slice(2).map((line, i) => (
                    <tr key={i}>
                      {cells(line).map((cell, j) => (
                        <td key={j} dir="auto">
                          {inline(cell, query)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>,
          );
        } else if (lines.every((line) => line.startsWith("> "))) {
          nodes.push(
            <blockquote key={key++} dir="auto">
              {inline(lines.map((line) => line.slice(2)).join(" "), query)}
            </blockquote>,
          );
        } else if (heading) {
          nodes.push(
            heading[1].length === 2 ? (
              <h2 key={key++} dir="auto" className="text-2xl font-bold">
                {inline(heading[2], query)}
              </h2>
            ) : (
              <h3 key={key++} dir="auto" className="text-xl font-bold">
                {inline(heading[2], query)}
              </h3>
            ),
          );
        } else if (lines.every((line) => /^\d+\.\s+/.test(line))) {
          nodes.push(
            <ol key={key++} dir="auto" className="list-decimal space-y-1 pl-6">
              {lines.map((line, index) => (
                <li key={index} dir="auto">
                  {inline(line.replace(/^\d+\.\s+/, ""), query)}
                </li>
              ))}
            </ol>,
          );
        } else if (lines.every((line) => /^-\s+/.test(line))) {
          nodes.push(
            <ul key={key++} dir="auto" className="list-disc space-y-1 pl-6">
              {lines.map((line, index) => (
                <li key={index} dir="auto">
                  {inline(line.replace(/^-\s+/, ""), query)}
                </li>
              ))}
            </ul>,
          );
        } else {
          nodes.push(
            <p key={key++} dir="auto">
              {inline(paragraph.replace(/\s*\n\s*/g, " "), query)}
            </p>,
          );
        }
      });
  });
  return <div className="reading-text">{nodes}</div>;
}
