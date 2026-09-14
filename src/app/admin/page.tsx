import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "../../lib/supabase/auth";
import { AdminDashboard } from "./components/AdminDashboard";

export default async function AdminPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/admin/login");
  return <AdminDashboard />;
}
