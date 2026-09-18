import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { SESSION_COOKIE_NAME, verifyToken } from '@/lib/utils';
import AdminShell from './AdminShell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    redirect('/masuk?next=/admin');
  }

  const payload = verifyToken(token);

  if (!payload) {
    redirect('/masuk?next=/admin');
  }

  const [user] = await db
    .select({
      id: users.id,
      role: users.role,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.id, payload.userId));

  if (!user || !user.emailVerified) {
    redirect('/masuk?next=/admin');
  }

  if (user.role !== 'admin') {
    redirect('/');
  }

  return <AdminShell>{children}</AdminShell>;
}
