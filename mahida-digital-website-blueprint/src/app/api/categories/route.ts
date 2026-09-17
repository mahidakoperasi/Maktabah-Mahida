import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");

    const allCategories = type
      ? await db
          .select()
          .from(categories)
          .where(eq(categories.type, type))
      : await db.select().from(categories);

    return NextResponse.json({
      data: allCategories,
      count: allCategories.length,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, type } = body;

    if (!name || !slug || !type) {
      return NextResponse.json(
        { error: "Name, slug, and type are required" },
        { status: 400 }
      );
    }

    const newCategory = await db
      .insert(categories)
      .values({
        name,
        slug,
        description,
        type,
      })
      .returning();

    return NextResponse.json(newCategory[0], { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
