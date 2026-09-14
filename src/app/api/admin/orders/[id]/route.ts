import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../../lib/supabase/auth";
import { getAdminOrder, updateAdminOrder } from "../../../../../lib/supabase/adminOrders";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getAuthenticatedUser()) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  try { const order = await getAdminOrder((await context.params).id); return order ? NextResponse.json({ order }) : NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 }); }
  catch { return NextResponse.json({ error: "Não foi possível carregar o pedido." }, { status: 500 }); }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getAuthenticatedUser()) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  try { const body = await request.json(); const order = await updateAdminOrder((await context.params).id, body.status, body); return NextResponse.json({ order }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível atualizar o pedido." }, { status: 400 }); }
}
