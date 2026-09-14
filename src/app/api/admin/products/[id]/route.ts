import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../../lib/supabase/auth";
import { getAdminProduct, updateAdminProduct } from "../../../../../lib/supabase/adminProducts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { if (!await getAuthenticatedUser()) return NextResponse.json({ error: "Não autenticado." }, { status: 401 }); try { const product = await getAdminProduct((await context.params).id); return product ? NextResponse.json({ product }) : NextResponse.json({ error: "Produto não encontrado." }, { status: 404 }); } catch { return NextResponse.json({ error: "Não foi possível carregar o produto." }, { status: 500 }); } }
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) { if (!await getAuthenticatedUser()) return NextResponse.json({ error: "Não autenticado." }, { status: 401 }); try { return NextResponse.json({ product: await updateAdminProduct((await context.params).id, await request.json()) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível atualizar o produto." }, { status: 400 }); } }
