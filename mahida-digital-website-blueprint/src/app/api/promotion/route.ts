import { NextResponse } from "next/server";
import { activePromotion } from "@/lib/promotion-schema";
import { getPromotionSettings } from "@/lib/promotion-store";
export async function GET() {
  try {
    return NextResponse.json(
      { promotion: activePromotion((await getPromotionSettings()).published) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { promotion: null },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
