import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function GET() {
  try {
    // Test database connection
    await db.select().from(users).limit(1);

    return NextResponse.json(
      { status: "ok", message: "Mahida Digital is running" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { status: "error", message: "Health check failed" },
      { status: 500 }
    );
  }
}
