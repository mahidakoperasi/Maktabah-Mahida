"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function PublicSiteChrome({
  children,
}: {
  children: ReactNode;
}) {
  const path = usePathname();
  return path === "/maktabah" || path.startsWith("/maktabah/")
    ? null
    : children;
}
