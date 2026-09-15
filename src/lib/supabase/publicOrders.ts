import "server-only";

import { getSupabaseServerClient } from "./server";

export async function findPublicOrder(orderNumber: string, identifier: string) {
  const client = getSupabaseServerClient();
  const digits = identifier.replace(/\D/g, "");
  const { data, error } = await client.from("orders").select("order_number,created_at,customer_name,status,total,carrier,tracking_code,tracking_url").eq("order_number", orderNumber).or(`customer_cpf.eq.${digits},customer_whatsapp.eq.${digits}`).maybeSingle();
  if (error) throw new Error("Não foi possível consultar o pedido.");
  return data;
}
