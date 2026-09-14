import { NextResponse } from "next/server";
import { findPublicOrder } from "../../../lib/supabase/publicOrders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim().toUpperCase().replace(/^#/, "") : "";
    const identifier = typeof body.identifier === "string" ? body.identifier : "";
    if (!orderNumber || !identifier) return NextResponse.json({ error: "Informe o pedido e o CPF ou WhatsApp." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    const order = await findPublicOrder(orderNumber, identifier);
    return NextResponse.json({ order }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível consultar o pedido." }, { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
