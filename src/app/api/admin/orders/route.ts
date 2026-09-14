import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../lib/supabase/auth";
import { listAdminOrders } from "../../../../lib/supabase/adminOrders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!await getAuthenticatedUser()) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const url = new URL(request.url);
  try { return NextResponse.json({ orders: await listAdminOrders(url.searchParams.get("search") ?? undefined, url.searchParams.get("status") ?? undefined) }); }
  catch { return NextResponse.json({ error: "Não foi possível carregar os pedidos." }, { status: 500 }); }
}
