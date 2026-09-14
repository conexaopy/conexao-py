import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../lib/supabase/auth";
import { createAdminProduct, getAdminProductOptions, listAdminProducts } from "../../../../lib/supabase/adminProducts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await getAuthenticatedUser()) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  try { return NextResponse.json({ products: await listAdminProducts({ search: params.get("search") ?? undefined, category: params.get("category") ?? undefined, active: params.get("active") ?? undefined, status: params.get("status") ?? undefined, featured: params.get("featured") ?? undefined }), categories: await getAdminProductOptions() }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ error: "Não foi possível carregar os produtos." }, { status: 500 }); }
}

export async function POST(request: Request) {
  if (!await getAuthenticatedUser()) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  try { return NextResponse.json({ product: await createAdminProduct(await request.json()) }, { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível criar o produto." }, { status: 400 }); }
}
