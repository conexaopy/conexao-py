import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../lib/supabase/auth";
import { dashboardData } from "../../../../lib/supabase/adminManagement";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { if (!await getAuthenticatedUser()) return NextResponse.json({ error: "Não autenticado." }, { status: 401 }); try { return NextResponse.json(await dashboardData(), { headers: { "Cache-Control": "no-store" } }); } catch { return NextResponse.json({ error: "Não foi possível carregar o dashboard." }, { status: 500 }); } }
