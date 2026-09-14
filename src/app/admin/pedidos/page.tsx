import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "../../../lib/supabase/auth";
import { AdminOrders } from "../components/AdminOrders";

export default async function AdminOrdersPage() {
  if (!await getAuthenticatedUser()) redirect("/admin/login");
  return <AdminOrders />;
}
