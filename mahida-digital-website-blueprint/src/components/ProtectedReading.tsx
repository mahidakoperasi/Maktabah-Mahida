import type { ReactNode } from "react";
import { getPromotionSettings } from "@/lib/promotion-store";
import ProtectedReadingClient from "./ProtectedReadingClient";
// Public reading protection shared by works and the native Maktabah pages.
export default async function ProtectedReading({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const { protectionEnabled } = await getPromotionSettings();
  return (
    <ProtectedReadingClient enabled={enabled && protectionEnabled}>
      {children}
    </ProtectedReadingClient>
  );
}
