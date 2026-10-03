import { timingSafeEqual } from "node:crypto";
import { syncLibrary } from "@/lib/maktabah-store";
export async function POST(request: Request) {
  const expected = process.env.MAKTABAH_SYNC_SECRET;
  const actual = request.headers.get("authorization") ?? "";
  const token = `Bearer ${expected}`;
  if (
    !expected ||
    Buffer.byteLength(actual) !== Buffer.byteLength(token) ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(token))
  )
    return Response.json({ error: "Tidak diizinkan." }, { status: 403 });
  await syncLibrary();
  return Response.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
