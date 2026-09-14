import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { count, error } = await getSupabaseServerClient()
      .from("categories")
      .select("id", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({ ok: false, error: "Supabase test query failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, categories: count ?? 0 });
  } catch {
    return NextResponse.json({ ok: false, error: "Supabase server configuration failed" }, { status: 500 });
  }
}
