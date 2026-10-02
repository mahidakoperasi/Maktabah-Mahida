import DesignManager from '@/components/admin/DesignManager';
import { designPath } from '@/lib/design-schema';
export default async function Page({ searchParams }: { searchParams: Promise<{ path?: string }> }) {
  const { path } = await searchParams;
  return <DesignManager kind="content" initialPath={path && designPath(path) ? path : undefined} />;
}
