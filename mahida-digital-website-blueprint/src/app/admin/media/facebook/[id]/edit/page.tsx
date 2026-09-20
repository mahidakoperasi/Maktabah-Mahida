import FacebookEditor from '@/components/admin/FacebookEditor';
export default async function EditFacebookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FacebookEditor postId={Number(id)} />;
}
