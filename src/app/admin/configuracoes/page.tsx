import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "../../../lib/supabase/auth";
import { AdminSettings } from "../components/AdminSettings";
export default async function SettingsPage() { if (!await getAuthenticatedUser()) redirect("/admin/login"); return <AdminSettings />; }
