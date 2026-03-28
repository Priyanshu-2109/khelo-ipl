import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminPanel } from "@/components/admin/admin-panel";
import { AdminSetupCard } from "@/components/admin/admin-setup-card";
import { hasAdminAccount } from "@/lib/admin-bootstrap";

export default async function AdminPage() {
  const configured = await hasAdminAccount();

  if (!configured) {
    return <AdminSetupCard />;
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  if (!session.user.isAdmin) {
    redirect("/dashboard");
  }

  return <AdminPanel />;
}
