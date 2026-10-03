import { cookies } from "next/headers";
import { pool } from "@/db";
import { verifyToken, SESSION_COOKIE_NAME } from "./utils";
import { canAccess } from "./admin-permissions";
import { PRIMARY_ADMIN_EMAIL } from "./admin-config";
export async function canPreviewLibrary(value?: string) {
  if (value !== "1") return false;
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return false;
  const user = (
    await pool.query(
      "SELECT role,email,email_verified,admin_access FROM users WHERE id=$1",
      [payload.userId],
    )
  ).rows[0];
  return Boolean(
    user?.role === "admin" &&
    user.email_verified &&
    canAccess(
      user.admin_access,
      "content",
      user.email.toLowerCase() === PRIMARY_ADMIN_EMAIL,
    ),
  );
}
