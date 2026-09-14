import { NextResponse } from "next/server";
import { getSupabaseAuthServerClient } from "../../../../lib/supabase/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
    const client = await getSupabaseAuthServerClient();
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível entrar no painel." }, { status: 500 });
  }
}
