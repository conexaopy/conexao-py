import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function publicEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variável Supabase ausente: ${name}.`);
  return value;
}

export async function getSupabaseAuthServerClient() {
  const cookieStore = await cookies();
  return createServerClient(publicEnv("NEXT_PUBLIC_SUPABASE_URL"), publicEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server Components cannot always write cookies. */ } },
    },
  });
}

export async function getAuthenticatedUser() {
  const client = await getSupabaseAuthServerClient();
  const { data: { user } } = await client.auth.getUser();

  if (!user) return null;

  const adminUserId = process.env.ADMIN_USER_ID;

  if (!adminUserId) {
    console.error("ADMIN_USER_ID não configurado.");
    return null;
  }

  if (user.id !== adminUserId) {
    return null;
  }

  return user;
}
