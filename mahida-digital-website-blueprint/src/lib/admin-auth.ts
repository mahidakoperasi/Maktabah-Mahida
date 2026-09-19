import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { SESSION_COOKIE_NAME, verifyToken } from '@/lib/utils';

export async function getAdminUser(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (!user || !user.emailVerified || user.role !== 'admin') {
    return null;
  }

  return user;
}
