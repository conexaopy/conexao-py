import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../../lib/supabase/auth";
import { bulkUpdateAdminProducts } from "../../../../../lib/supabase/adminProducts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  if (!await getAuthenticatedUser()) {
    return NextResponse.json(
      { error: "Não autenticado." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    const products = await bulkUpdateAdminProducts(
      body.ids,
      body.changes ?? {},
    );

    return NextResponse.json({
      products,
      updated: products.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar os produtos.",
      },
      { status: 400 },
    );
  }
}
