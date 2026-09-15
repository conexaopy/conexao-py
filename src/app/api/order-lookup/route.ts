import { NextResponse } from "next/server";
import { findPublicOrder } from "../../../lib/supabase/publicOrders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const orderNumber =
      typeof body.orderNumber === "string"
        ? body.orderNumber.trim().toUpperCase().replace(/^#/, "")
        : "";

    const identifier =
      typeof body.identifier === "string"
        ? body.identifier.replace(/\D/g, "")
        : "";

    if (!/^CPY-\d{1,12}$/.test(orderNumber) || !/^\d{11}$/.test(identifier)) {
      return NextResponse.json(
        { error: "Informe um número de pedido e CPF ou WhatsApp válidos." },
        {
          status: 400,
          headers: { "Cache-Control": "no-store, max-age=0" },
        },
      );
    }

    const result = await findPublicOrder(orderNumber, identifier);

    if (!result) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        {
          status: 404,
          headers: { "Cache-Control": "no-store, max-age=0" },
        },
      );
    }

    return NextResponse.json(
      {
        order: result.order,
        history: result.history,
      },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Não foi possível consultar o pedido." },
      {
        status: 500,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  }
}
