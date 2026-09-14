import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "../../../lib/supabase/auth";
import { AdminCategories } from "../components/AdminCategories";
export default async function CategoriesPage() { if (!await getAuthenticatedUser()) redirect("/admin/login"); return <AdminCategories />; }
