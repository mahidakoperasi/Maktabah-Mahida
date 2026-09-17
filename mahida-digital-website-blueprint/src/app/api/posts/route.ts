import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    const type = searchParams.get("type");
    const status = searchParams.get("status") ?? "PUBLISHED";

    const conditions: any[] = [];

    if (type) {
      conditions.push(eq(posts.type, type as any));
    }

    if (status) {
      conditions.push(eq(posts.status, status as any));
    }

    const allPosts =
      conditions.length > 0
        ? await db
            .select()
            .from(posts)
            .where(and(...conditions))
            .limit(limit)
            .offset(offset)
        : await db.select().from(posts).limit(limit).offset(offset);

    return NextResponse.json({
      data: allPosts,
      count: allPosts.length,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { title, slug, excerpt, content, type, status, authorId, userId } =
      body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: "Title and slug are required" },
        { status: 400 }
      );
    }

    const newPost = await db
      .insert(posts)
      .values({
        title,
        slug,
        excerpt,
        content,
        type: type || "ARTICLE",
        status: status || "DRAFT",
        authorId,
        userId,
      })
      .returning();

    return NextResponse.json(newPost[0], { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
