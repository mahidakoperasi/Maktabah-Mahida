import { searchLibrary } from "@/lib/maktabah-search";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = params.get("q") ?? "";
  if (q.length > 200)
    return Response.json(
      { error: "Pencarian maksimal 200 karakter." },
      { status: 400 },
    );
  try {
    return Response.json(
      await searchLibrary(q, {
        bookSlug: params.get("kitab")?.slice(0, 500),
        fan: params.get("fan")?.slice(0, 100),
        kind: params.get("jenis") ?? "all",
        page: Math.min(10000, Math.max(1, Number(params.get("page")) || 1)),
        selected: params.get("selected")?.slice(0, 18),
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Pencarian sementara gagal. Coba kembali." },
      { status: 503 },
    );
  }
}
