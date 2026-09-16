import { NextResponse } from "next/server";
import { validateCoupon } from "../../../../lib/supabase/coupons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const code =
      typeof body.code === "string"
        ? body.code.trim().toUpperCase()
        : "";

    const subtotal =
      typeof body.subtotal === "number"
        ? body.subtotal
        : Number(body.subtotal);

    if (!code || !Number.isFinite(subtotal) || subtotal <= 0) {
      return NextResponse.json(
        { error: "Informe um cupom válido." },
        {
          status: 400,
          headers: { "Cache-Control": "no-store, max-age=0" },
        },
      );
    }

    const coupon = await validateCoupon(code, subtotal);

    return NextResponse.json(
      {
        ok: true,
        coupon,
      },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  } catch (error) {
    const status =
      typeof error === "object" &&
      error &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 500;

    return NextResponse.json(
      {
        ok: false,
        error:
          status === 400 && error instanceof Error
            ? error.message
            : "Não foi possível validar o cupom.",
      },
      {
        status,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  }
}
