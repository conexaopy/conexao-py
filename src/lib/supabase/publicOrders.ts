import "server-only";

import { getSupabaseServerClient } from "./server";

export async function findPublicOrder(orderNumber: string, identifier: string) {
  const client = getSupabaseServerClient();
  const digits = identifier.replace(/\D/g, "");
  const { data, error } = await client.from("orders").select("order_number,created_at,customer_name,status,total,carrier,tracking_code,tracking_url").eq("order_number", orderNumber).or(`customer_cpf.eq.${digits},customer_whatsapp.eq.${digits}`).maybeSingle();
  if (error) throw new Error("Não foi possível consultar o pedido.");
  if (!data) return null;

  const { data: history, error: historyError } = await client
    .from("orders")
    .select("order_number,created_at,customer_name,status,total,carrier,tracking_code,tracking_url")
    .eq("customer_cpf", digits)
    .order("created_at", { ascending: false });

  if (historyError) {
    throw new Error("Não foi possível consultar o histórico de pedidos.");
  }

  return {
    order: data,
    history: history ?? [],
  };
}

export async function findOrderConfirmation(orderId: string) {
  const client = getSupabaseServerClient();

  const { data: order, error } = await client
    .from("orders")
    .select("id,order_number,created_at,customer_name,customer_cpf,customer_whatsapp,customer_email,delivery_cep,delivery_street,delivery_number,delivery_complement,delivery_neighborhood,delivery_city,delivery_state,status,subtotal,discount,shipping,total")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw new Error("Não foi possível carregar a confirmação do pedido.");
  if (!order) return null;

  const { data: items, error: itemsError } = await client
    .from("order_items")
    .select("product_id,product_name,product_presentation,quantity,unit_price")
    .eq("order_id", orderId);

  if (itemsError) throw new Error("Não foi possível carregar os itens do pedido.");

  return {
    id: String(order.id),
    orderNumber: String(order.order_number),
    createdAt: String(order.created_at),
    status: order.status,
    customer: {
      name: String(order.customer_name),
      cpf: String(order.customer_cpf),
      whatsapp: String(order.customer_whatsapp),
      email: String(order.customer_email),
    },
    address: {
      cep: String(order.delivery_cep),
      street: String(order.delivery_street),
      number: String(order.delivery_number),
      complement: String(order.delivery_complement ?? ""),
      neighborhood: String(order.delivery_neighborhood),
      city: String(order.delivery_city),
      state: String(order.delivery_state),
    },
    items: (items ?? []).map((item) => ({
      id: String(item.product_id ?? item.product_name),
      name: String(item.product_name),
      presentation: String(item.product_presentation ?? "Apresentação não informada"),
      quantity: Number(item.quantity),
      price: Number(item.unit_price),
      accent: "#d93636",
    })),
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shipping: Number(order.shipping),
    total: Number(order.total),
  };
}
