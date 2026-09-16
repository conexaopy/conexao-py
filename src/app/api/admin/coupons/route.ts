import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../lib/supabase/auth";
import { deleteCoupon, listCoupons, saveCoupon } from "../../../../lib/supabase/adminManagement";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { if (!await getAuthenticatedUser()) return NextResponse.json({ error: "Não autenticado." }, { status: 401 }); try { return NextResponse.json({ coupons: await listCoupons() }, { headers: { "Cache-Control": "no-store" } }); } catch { return NextResponse.json({ error: "Não foi possível carregar cupons." }, { status: 500 }); } }
export async function POST(request: Request) { if (!await getAuthenticatedUser()) return NextResponse.json({ error: "Não autenticado." }, { status: 401 }); try { const body = await request.json(); return NextResponse.json({ coupon: await saveCoupon(body.id, body) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível salvar o cupom." }, { status: 400 }); } }

export async function DELETE(request: Request) {
  if (!await getAuthenticatedUser()) {
    return NextResponse.json(
      { error: "Não autenticado." },
      { status: 401 },
    );
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        { error: "Cupom não informado." },
        { status: 400 },
      );
    }

    const deleted = await deleteCoupon(id);

    return NextResponse.json({ deleted });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível excluir o cupom.",
      },
      { status: 400 },
    );
  }
}

