import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { PRIMARY_ADMIN_EMAIL } from '@/lib/admin-config';
import { SESSION_COOKIE_NAME, verifyToken } from '@/lib/utils';
import AdminShell from './AdminShell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) redirect('/masuk?next=/admin');

  const payload = verifyToken(token);
  if (!payload) redirect('/masuk?next=/admin');

  const [user] = await db
    .select({
      id: users.id,
      role: users.role,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, payload.userId));

  if (!user || user.role !== 'admin') {
    redirect('/masuk?next=/admin');
  }

  return (
    <AdminShell isPrimaryAdmin={user.email.toLowerCase() === PRIMARY_ADMIN_EMAIL}>
      {children}
    </AdminShell>
  );
}
