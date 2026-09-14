import "server-only";

import { getSupabaseServerClient } from "./server";
import type { Address, Customer, Order, OrderItem } from "../../app/orderTypes";

type CartInput = { id: string; quantity: number };
type CreateOrderInput = { requestId: string; customer: Customer; address: Address; items: CartInput[] };
type ProductRow = { id: string; name: string; presentation: string | null; price: number | string; promo_price: number | string | null; stock_quantity: number | null; active: boolean };

const orderStatus = "AGUARDANDO PAGAMENTO" as const;

function serverError(message: string): Error & { status?: number } { const error = new Error(message) as Error & { status?: number }; error.status = 400; return error; }
function nextOrderNumber(values: string[]): string { const numbers = values.map((value) => Number(value.replace("CPY-", ""))).filter(Number.isFinite); return `CPY-${Math.max(1000, ...numbers) + 1}`; }

export async function createSupabaseOrder(input: CreateOrderInput): Promise<Order> {
  const client = getSupabaseServerClient();
  if (!input.requestId || !input.items.length) throw serverError("Carrinho vazio.");
  if (!input.customer.name.trim() || !input.customer.cpf || !input.customer.whatsapp || !input.customer.email || !input.address.cep || !input.address.street || !input.address.number || !input.address.neighborhood || !input.address.city || !input.address.state) throw serverError("Dados obrigatórios incompletos.");

  const { data: existingOrder, error: existingError } = await client.from("orders").select("id,order_number,customer_name,customer_cpf,customer_whatsapp,customer_email,delivery_cep,delivery_street,delivery_number,delivery_complement,delivery_neighborhood,delivery_city,delivery_state,status,subtotal,discount,shipping,total,created_at").eq("id", input.requestId).maybeSingle();
  if (existingError) throw new Error("Não foi possível verificar o pedido.");
  if (existingOrder) {
    const { data: existingItems, error: existingItemsError } = await client.from("order_items").select("product_id,product_name,product_presentation,quantity,unit_price").eq("order_id", existingOrder.id);
    if (existingItemsError) throw new Error("Não foi possível recuperar o pedido existente.");
    return orderFromRow(existingOrder, (existingItems ?? []).map((item) => ({ id: String(item.product_id ?? item.product_name), name: item.product_name, presentation: item.product_presentation ?? "Apresentação não informada", quantity: item.quantity, price: Number(item.unit_price), accent: "#d93636" })));
  }

  const uniqueIds = [...new Set(input.items.map((item) => item.id))];
  const { data: products, error: productsError } = await client.from("products").select("id,name,presentation,price,promo_price,stock_quantity,active").in("id", uniqueIds);
  if (productsError || !products || products.length !== uniqueIds.length) throw serverError("Um ou mais produtos não estão disponíveis.");
  const productMap = new Map((products as ProductRow[]).map((product) => [product.id, product]));
  const orderItems: OrderItem[] = input.items.map((item) => {
    const product = productMap.get(item.id);
    if (!product || !product.active || !Number.isInteger(item.quantity) || item.quantity < 1 || (product.stock_quantity ?? 0) < item.quantity) throw serverError("Um ou mais produtos não estão disponíveis.");
    return { id: product.id, name: product.name, presentation: product.presentation ?? "Apresentação não informada", price: Number(product.promo_price ?? product.price), accent: "#d93636", quantity: item.quantity };
  });
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = subtotal > 700 ? subtotal * .1 : 0;
  const shipping = subtotal === 0 || subtotal > 500 ? 0 : 29.9;
  const total = subtotal - discount + shipping;
  const { data: orderNumbers, error: numbersError } = await client.from("orders").select("order_number").order("created_at", { ascending: false }).limit(1000);
  if (numbersError) throw new Error("Não foi possível gerar o número do pedido.");
  const orderNumber = nextOrderNumber((orderNumbers ?? []).map((row) => row.order_number));
  let customerId: string | null = null;
  let createdCustomer = false;
  const { data: customer } = await client.from("customers").select("id").eq("cpf", input.customer.cpf).limit(1).maybeSingle();
  if (customer) customerId = customer.id;
  else {
    const { data: newCustomer, error: customerError } = await client.from("customers").insert({ full_name: input.customer.name, cpf: input.customer.cpf, whatsapp: input.customer.whatsapp, email: input.customer.email, cep: input.address.cep, street: input.address.street, number: input.address.number, complement: input.address.complement || null, neighborhood: input.address.neighborhood, city: input.address.city, state: input.address.state, active: true }).select("id").single();
    if (customerError || !newCustomer) throw new Error("Não foi possível salvar o cliente.");
    customerId = newCustomer.id;
    createdCustomer = true;
  }
  const orderPayload = { id: input.requestId, order_number: orderNumber, customer_id: customerId, customer_name: input.customer.name, customer_cpf: input.customer.cpf, customer_whatsapp: input.customer.whatsapp, customer_email: input.customer.email, delivery_cep: input.address.cep, delivery_street: input.address.street, delivery_number: input.address.number, delivery_complement: input.address.complement || null, delivery_neighborhood: input.address.neighborhood, delivery_city: input.address.city, delivery_state: input.address.state, status: orderStatus, subtotal, discount, shipping, total };
  const { data: savedOrder, error: orderError } = await client.from("orders").insert(orderPayload).select("*").single();
  if (orderError || !savedOrder) { if (createdCustomer && customerId) await client.from("customers").delete().eq("id", customerId); throw new Error("Não foi possível salvar o pedido."); }
  const itemPayload = orderItems.map((item) => ({ order_id: savedOrder.id, product_id: item.id, product_name: item.name, product_presentation: item.presentation, quantity: item.quantity, unit_price: item.price }));
  const { error: itemsError } = await client.from("order_items").insert(itemPayload);
  if (itemsError) { await client.from("orders").delete().eq("id", savedOrder.id); if (createdCustomer && customerId) await client.from("customers").delete().eq("id", customerId); throw new Error("Não foi possível salvar os itens do pedido."); }
  return orderFromRow(savedOrder, orderItems);
}

function orderFromRow(row: Record<string, unknown>, items: OrderItem[]): Order { return { id: String(row.id), orderNumber: String(row.order_number), createdAt: String(row.created_at), status: row.status as Order["status"], customer: { name: String(row.customer_name), cpf: String(row.customer_cpf), whatsapp: String(row.customer_whatsapp), email: String(row.customer_email) }, address: { cep: String(row.delivery_cep), street: String(row.delivery_street), number: String(row.delivery_number), complement: String(row.delivery_complement ?? ""), neighborhood: String(row.delivery_neighborhood), city: String(row.delivery_city), state: String(row.delivery_state) }, items, subtotal: Number(row.subtotal), discount: Number(row.discount), shipping: Number(row.shipping), total: Number(row.total) }; }
