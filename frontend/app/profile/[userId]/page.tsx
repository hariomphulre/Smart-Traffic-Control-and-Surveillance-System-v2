import ProfileClient from "./profileClient";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return <ProfileClient userId={userId} />;
}