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

    const normalizedOrderNumber = orderNumber
      .toUpperCase()
      .replace(/^#/, "");

    const validToken =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        confirmationToken,
      );

    const validOrderNumber = /^CPY-\d{1,12}$/.test(normalizedOrderNumber);

    if (!validToken || !validOrderNumber) {
      return NextResponse.json(
        { error: "Identificação do pedido inválida." },
        {
          status: 400,
          headers: { "Cache-Control": "no-store, max-age=0" },
        },
      );
    }

    const order = await findOrderConfirmation(confirmationToken, normalizedOrderNumber);

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
