import { NextResponse } from "next/server";
import { findOrderConfirmation } from "../../../lib/supabase/publicOrders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const confirmationToken =
      typeof body.confirmationToken === "string"
        ? body.confirmationToken.trim()
        : "";

    const orderNumber =
      typeof body.orderNumber === "string"
        ? body.orderNumber.trim()
        : "";

    if (!confirmationToken || !orderNumber) {
      return NextResponse.json(
        { error: "Identificação do pedido ausente." },
        {
          status: 400,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const order = await findOrderConfirmation(confirmationToken, orderNumber);

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        {
          status: 404,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    return NextResponse.json(
      { order },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar a confirmação do pedido." },
      {
        status: 500,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  }
}
