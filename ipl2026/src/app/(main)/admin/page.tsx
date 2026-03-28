import { AdminPageClient } from "./admin-page-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminPage() {
  return <AdminPageClient />;
}
