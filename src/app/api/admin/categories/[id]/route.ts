import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../../lib/supabase/auth";
import { setCategoryActive } from "../../../../../lib/supabase/adminManagement";
export const runtime = "nodejs";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) { if (!await getAuthenticatedUser()) return NextResponse.json({ error: "Não autenticado." }, { status: 401 }); try { const body = await request.json(); return NextResponse.json({ category: await setCategoryActive((await context.params).id, Boolean(body.active)) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível atualizar a categoria." }, { status: 400 }); } }
