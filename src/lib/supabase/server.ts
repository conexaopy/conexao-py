import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let supabaseServerClient: SupabaseClient | undefined;

function getRequiredServerEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SECRET_KEY"): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variável de ambiente do servidor ausente: ${name}.`);
  }

  return value;
}

export function getSupabaseServerClient(): SupabaseClient {
  if (!supabaseServerClient) {
    const url = getRequiredServerEnv("NEXT_PUBLIC_SUPABASE_URL");
    const secretKey = getRequiredServerEnv("SUPABASE_SECRET_KEY");
    supabaseServerClient = createClient(url, secretKey);
  }

  return supabaseServerClient;
}
