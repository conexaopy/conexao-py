import { NextResponse } from "next/server";
import { getSupabaseAuthServerClient } from "../../../../lib/supabase/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !password ||
      password.length > 256
    ) {
      return NextResponse.json(
        { error: "E-mail ou senha inválidos." },
        { status: 400 },
      );
    }

    const client = await getSupabaseAuthServerClient();

    const {
      data: { user },
      error,
    } = await client.auth.signInWithPassword({
      email,
      password,
    });

    const adminUserId = process.env.ADMIN_USER_ID;

    if (error || !user || !adminUserId || user.id !== adminUserId) {
      if (user) {
        await client.auth.signOut();
      }

      return NextResponse.json(
        { error: "E-mail ou senha inválidos." },
        { status: 401 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível entrar no painel." },
      { status: 500 },
    );
  }
}
