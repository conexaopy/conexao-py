import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "../../../lib/supabase/auth";
import { AdminCoupons } from "../components/AdminCoupons";
export default async function CouponsPage() { if (!await getAuthenticatedUser()) redirect("/admin/login"); return <AdminCoupons />; }
