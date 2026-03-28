import { auth } from "@/auth";

export async function requireSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireAdminUser() {
  const user = await requireSessionUser();
  if (!user?.isAdmin) return null;
  return user;
}
