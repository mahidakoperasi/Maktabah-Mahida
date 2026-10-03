import { bookBySlug } from "@/lib/maktabah-store";
import { getPublicPage } from "@/lib/cms";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const book = (await getPublicPage("/maktabah"))
    ? await bookBySlug((await params).slug)
    : null;
  return book
    ? Response.json(
        { hash: book.contentHash },
        { headers: { "Cache-Control": "no-store" } },
      )
    : Response.json(
        { error: "Kitab tidak tersedia." },
        { status: 410, headers: { "Cache-Control": "no-store" } },
      );
}
