import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "../../../lib/supabase/auth";
import { AdminProducts } from "../components/AdminProducts";

export default async function AdminProductsPage() { if (!await getAuthenticatedUser()) redirect("/admin/login"); return <AdminProducts />; }
