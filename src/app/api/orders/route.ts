import { NextResponse } from "next/server";
import { createSupabaseOrder } from "../../../lib/supabase/orders";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order, confirmationToken } = await createSupabaseOrder(body);
    return NextResponse.json({
      ok: true,
      order,
      confirmationToken,
    });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error && typeof error.status === "number" ? error.status : 500;
    return NextResponse.json({ ok: false, error: error instanceof Error && status === 400 ? error.message : "Não foi possível criar o pedido." }, { status });
  }
}
