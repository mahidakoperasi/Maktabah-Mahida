import type { ReactNode } from "react";
export default function ArabicText({ text }: { text: string }): ReactNode {
  return text
    .split(
      /([\p{Script=Arabic}][\p{Script=Arabic}\p{M}\u200c\u200d]*(?:[ ]+[\p{Script=Arabic}][\p{Script=Arabic}\p{M}\u200c\u200d]*)*)/u,
    )
    .map((part, index) =>
      /\p{Script=Arabic}/u.test(part) ? (
          <span className="arabic-inline" lang="ar" key={index}>
          {part}
        </span>
      ) : (
        part
      ),
    );
}
