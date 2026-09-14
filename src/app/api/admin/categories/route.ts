import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../lib/supabase/auth";
import { listCategories, saveCategory } from "../../../../lib/supabase/adminManagement";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { if (!await getAuthenticatedUser()) return NextResponse.json({ error: "Não autenticado." }, { status: 401 }); try { return NextResponse.json({ categories: await listCategories() }, { headers: { "Cache-Control": "no-store" } }); } catch { return NextResponse.json({ error: "Não foi possível carregar categorias." }, { status: 500 }); } }
export async function POST(request: Request) { if (!await getAuthenticatedUser()) return NextResponse.json({ error: "Não autenticado." }, { status: 401 }); try { const body = await request.json(); return NextResponse.json({ category: await saveCategory(body.id, body) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível salvar a categoria." }, { status: 400 }); } }
