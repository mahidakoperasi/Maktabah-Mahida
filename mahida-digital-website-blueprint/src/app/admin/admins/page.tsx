import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { PRIMARY_ADMIN_EMAIL } from '@/lib/admin-config';
import { SESSION_COOKIE_NAME, verifyToken } from '@/lib/utils';
import AdminManager from '@/components/admin/AdminManager';

export default async function AdminManagementPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;

  if (!payload) redirect('/masuk?next=/admin/admins');

  const [user] = await db
    .select({ email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (
    !user ||
    user.role !== 'admin' ||
    user.email.toLowerCase() !== PRIMARY_ADMIN_EMAIL
  ) {
    redirect('/admin');
  }

  return <AdminManager />;
}
