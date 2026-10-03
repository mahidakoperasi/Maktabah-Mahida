import "server-only";
import { cache } from "react";
import { pool } from "@/db";
import {
  PROMOTION_KEY,
  readPromotionSettings,
  type PromotionSettings,
} from "./promotion-schema";

export const getPromotionSettings = cache(
  async (): Promise<PromotionSettings> => {
    const row = (
      await pool.query("SELECT value FROM settings WHERE key=$1", [
        PROMOTION_KEY,
      ])
    ).rows[0];
    if (!row) return { protectionEnabled: true, draft: null, published: null };
    const value = JSON.parse(row.value);
    return readPromotionSettings(value);
  },
);
export async function promotionStatistics(id: string | undefined, days = 180) {
  if (!id) return { view: 0, close: 0, click: 0 };
  const rows = (
    await pool.query(
      "SELECT event,sum(count)::text AS total FROM analytics_daily WHERE event=ANY($1::varchar[]) AND day >= (now() AT TIME ZONE 'Asia/Jakarta')::date-($2::integer-1) GROUP BY event",
      [
        ["p:" + id + ":view", "p:" + id + ":close", "p:" + id + ":click"],
        Math.max(1, Math.min(180, Math.trunc(days))),
      ],
    )
  ).rows;
  return Object.fromEntries(
    ["view", "close", "click"].map((event) => [
      event,
      Number(rows.find((r) => r.event === `p:${id}:${event}`)?.total ?? 0),
    ]),
  ) as { view: number; close: number; click: number };
}
