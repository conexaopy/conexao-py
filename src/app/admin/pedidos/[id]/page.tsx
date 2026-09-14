import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "../../../../lib/supabase/auth";
import { AdminOrderDetail } from "../../components/AdminOrderDetail";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) { if (!await getAuthenticatedUser()) redirect("/admin/login"); return <AdminOrderDetail id={(await params).id} />; }
