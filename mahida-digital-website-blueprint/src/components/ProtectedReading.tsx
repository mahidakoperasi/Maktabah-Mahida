import type { ReactNode } from "react";
import { getPromotionSettings } from "@/lib/promotion-store";
import ProtectedReadingClient from "./ProtectedReadingClient";
// Reuse this boundary around the native Maktabah reader in steps 2–3.
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
