import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      {
        ok: false,
        database: "not_configured",
        authSchemaReady: false,
        articleCmsReady: false,
      },
      { status: 503 }
    );
  }

  try {
    const connection = await db.execute(sql`select 1 as ok`);
    const schema = await db.execute(sql`
      select
        to_regclass('public.users') is not null as users_table,
        to_regclass('public.otp_codes') is not null as otp_codes_table,
        to_regclass('public.posts') is not null as posts_table
    `);

    const row = schema.rows?.[0] as
      | { users_table?: boolean; otp_codes_table?: boolean; posts_table?: boolean }
      | undefined;

    const usersTable = Boolean(row?.users_table);
    const otpCodesTable = Boolean(row?.otp_codes_table);
    const postsTable = Boolean(row?.posts_table);

    return Response.json({
      ok: Boolean(connection),
      database: "connected",
      authSchemaReady: usersTable && otpCodesTable,
      articleCmsReady: postsTable,
      tables: {
        users: usersTable,
        otpCodes: otpCodesTable,
        posts: postsTable,
      },
    });
  } catch (error) {
    console.error("Health check error:", error);
    return Response.json(
      {
        ok: false,
        database: "unreachable",
        authSchemaReady: false,
        articleCmsReady: false,
      },
      { status: 503 }
    );
  }
}
