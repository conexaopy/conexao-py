import "server-only";

import { getSupabaseServerClient } from "./server";
import type { OrderStatus } from "../../app/orderTypes";

export const adminStatuses: OrderStatus[] = ["AGUARDANDO PAGAMENTO", "PAGAMENTO CONFIRMADO", "PRODUTO CONFIRMADO", "PREPARANDO ENVIO", "ENVIADO", "RASTREIO DISPONÍVEL", "ENTREGUE", "CANCELADO"];
const listFields = "id,order_number,created_at,customer_name,customer_whatsapp,customer_cpf,delivery_city,delivery_state,status,total";
const detailFields = "id,order_number,created_at,updated_at,customer_id,customer_name,customer_cpf,customer_whatsapp,customer_email,delivery_cep,delivery_street,delivery_number,delivery_complement,delivery_neighborhood,delivery_city,delivery_state,status,subtotal,discount,shipping,total,coupon_code,notes,carrier,tracking_code,tracking_url";

export async function listAdminOrders(search?: string, status?: string) {
  const client = getSupabaseServerClient();
  let query = client.from("orders").select(listFields).order("created_at", { ascending: false });
  if (status && adminStatuses.includes(status as OrderStatus)) query = query.eq("status", status);
  if (search?.trim()) {
    const term = search.trim().replace(/[(),]/g, "");
    query = query.or(`order_number.ilike.%${term}%,customer_name.ilike.%${term}%,customer_cpf.ilike.%${term}%,customer_whatsapp.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) throw new Error("Não foi possível carregar os pedidos.");
  return data ?? [];
}

export async function getAdminOrder(id: string) {
  const client = getSupabaseServerClient();
  const { data: order, error } = await client.from("orders").select(detailFields).eq("id", id).maybeSingle();
  if (error) throw new Error("Não foi possível carregar o pedido.");
  if (!order) return null;
  const { data: items, error: itemsError } = await client.from("order_items").select("id,product_id,product_name,product_presentation,quantity,unit_price,total_price,created_at").eq("order_id", id).order("created_at");
  if (itemsError) throw new Error("Não foi possível carregar os itens do pedido.");

  const { data: history, error: historyError } = await client
    .from("order_status_history")
    .select("id,status,created_at")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  if (historyError) throw new Error("Não foi possível carregar o histórico do pedido.");

  return { ...order, items: items ?? [], history: history ?? [] };
}

export async function updateAdminOrder(id: string, status: string, tracking?: { carrier?: string; trackingCode?: string; trackingUrl?: string; notes?: string }) {
  if (!adminStatuses.includes(status as OrderStatus)) throw new Error("Status inválido.");

  const client = getSupabaseServerClient();

  const { data: currentOrder, error: currentError } = await client
    .from("orders")
    .select("status,stock_reserved")
    .eq("id", id)
    .single();

  if (currentError || !currentOrder) {
    throw new Error("Não foi possível carregar o pedido.");
  }

  if (status === "CANCELADO") {
    const { error: stockError } = await client.rpc(
      "release_order_stock",
      {
        p_order_id: id,
      },
    );

    if (stockError) {
      throw new Error("Não foi possível devolver o estoque do pedido.");
    }
  } else if (
    currentOrder.status === "CANCELADO" &&
    !currentOrder.stock_reserved
  ) {
    const { error: stockError } = await client.rpc(
      "reserve_order_stock",
      {
        p_order_id: id,
      },
    );

    if (stockError) {
      throw new Error(
        stockError.message.includes("Estoque insuficiente")
          ? "Não há estoque suficiente para reativar este pedido."
          : "Não foi possível reservar novamente o estoque do pedido.",
      );
    }
  }

  const payload: Record<string, string | null> = {
    status,
    notes: tracking?.notes?.trim() || null,
  };

  if (status === "ENVIADO" || status === "RASTREIO DISPONÍVEL") {
    payload.carrier = tracking?.carrier?.trim() || null;
    payload.tracking_code = tracking?.trackingCode?.trim() || null;
    payload.tracking_url = tracking?.trackingUrl?.trim() || null;
  }

  const { data, error } = await client
    .from("orders")
    .update(payload)
    .eq("id", id)
    .select(detailFields)
    .single();

  if (error) {
    throw new Error("Não foi possível atualizar o pedido.");
  }

  if (currentOrder.status !== status) {
    const { error: historyError } = await client
      .from("order_status_history")
      .insert({
        order_id: id,
        status,
      });

    if (historyError) {
      console.error("Não foi possível registrar o histórico do pedido.", historyError);
    }
  }

  return data;
}
