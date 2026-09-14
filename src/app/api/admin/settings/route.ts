import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../lib/supabase/auth";
import { listSettings, updateSetting } from "../../../../lib/supabase/adminManagement";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { if (!await getAuthenticatedUser()) return NextResponse.json({ error: "Não autenticado." }, { status: 401 }); try { return NextResponse.json({ settings: await listSettings() }, { headers: { "Cache-Control": "no-store" } }); } catch { return NextResponse.json({ error: "Não foi possível carregar configurações." }, { status: 500 }); } }
export async function PATCH(request: Request) { if (!await getAuthenticatedUser()) return NextResponse.json({ error: "Não autenticado." }, { status: 401 }); try { const body = await request.json(); if (typeof body.key !== "string" || typeof body.value !== "string") throw new Error("Configuração inválida."); return NextResponse.json({ setting: await updateSetting(body.key, body.value) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível atualizar a configuração." }, { status: 400 }); } }
