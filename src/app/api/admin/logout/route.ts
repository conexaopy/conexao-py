import { NextResponse } from "next/server";
import { getSupabaseAuthServerClient } from "../../../../lib/supabase/auth";

export const runtime = "nodejs";

export async function POST() {
  const client = await getSupabaseAuthServerClient();
  await client.auth.signOut();
  return NextResponse.json({ ok: true });
}
