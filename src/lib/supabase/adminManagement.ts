import "server-only";

import { getSupabaseServerClient } from "./server";

export async function dashboardData() {
  const client = getSupabaseServerClient();
  const [orders, products, customers] = await Promise.all([
    client.from("orders").select("id,order_number,customer_name,total,status,created_at").order("created_at", { ascending: false }),
    client.from("products").select("id", { count: "exact", head: true }).eq("active", true),
    client.from("customers").select("id", { count: "exact", head: true }),
  ]);
  if (orders.error || products.error || customers.error) throw new Error("Não foi possível carregar o dashboard.");
  const validOrders = (orders.data ?? []).filter((order) => order.status !== "CANCELADO");
  return { metrics: { totalOrders: orders.data?.length ?? 0, awaiting: validOrders.filter((o) => o.status === "AGUARDANDO PAGAMENTO").length, confirmed: validOrders.filter((o) => o.status === "PAGAMENTO CONFIRMADO").length, shipped: validOrders.filter((o) => ["ENVIADO", "RASTREIO DISPONÍVEL"].includes(o.status)).length, delivered: validOrders.filter((o) => o.status === "ENTREGUE").length, activeProducts: products.count ?? 0, customers: customers.count ?? 0, revenue: validOrders.reduce((sum, order) => sum + Number(order.total), 0) }, recentOrders: (orders.data ?? []).slice(0, 8) };
}

export async function listCategories() { const client = getSupabaseServerClient(); const [{ data, error }, { data: products, error: productsError }] = await Promise.all([client.from("categories").select("id,name,slug,description,active,sort_order,created_at,updated_at").order("sort_order"), client.from("products").select("category_id")]); if (error || productsError) throw new Error("Não foi possível carregar categorias."); const counts = new Map<string, number>(); (products ?? []).forEach((product) => counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1)); return (data ?? []).map((category) => ({ ...category, product_count: counts.get(category.id) ?? 0 })); }
export async function saveCategory(id: string | undefined, input: { name: string; slug: string; description?: string; active?: boolean; sort_order?: number }) { const client = getSupabaseServerClient(); const payload = { name: input.name.trim(), slug: input.slug.trim().toLowerCase(), description: input.description?.trim() || null, active: input.active ?? true, sort_order: Number(input.sort_order ?? 0) }; if (!payload.name || !payload.slug) throw new Error("Nome e slug são obrigatórios."); const query = id ? client.from("categories").update(payload).eq("id", id) : client.from("categories").insert(payload); const { data, error } = await query.select("*").single(); if (error) throw new Error("Não foi possível salvar a categoria."); return data; }
export async function setCategoryActive(id: string, active: boolean) { const { data, error } = await getSupabaseServerClient().from("categories").update({ active }).eq("id", id).select("*").single(); if (error) throw new Error("Não foi possível atualizar a categoria."); return data; }

const couponFields = "id,code,description,discount_type,discount_value,minimum_order,maximum_discount,usage_limit,used_count,starts_at,expires_at,active,created_at,updated_at";
export async function listCoupons() { const { data, error } = await getSupabaseServerClient().from("coupons").select(couponFields).order("created_at", { ascending: false }); if (error) throw new Error("Não foi possível carregar cupons."); return data ?? []; }
export async function saveCoupon(id: string | undefined, input: Record<string, unknown>) { const payload = { code: String(input.code ?? "").trim().toUpperCase(), description: String(input.description ?? "").trim() || null, discount_type: String(input.discount_type ?? "PERCENTAGE"), discount_value: Number(input.discount_value), minimum_order: Number(input.minimum_order ?? 0), maximum_discount: input.maximum_discount === "" || input.maximum_discount == null ? null : Number(input.maximum_discount), usage_limit: input.usage_limit === "" || input.usage_limit == null ? null : Number(input.usage_limit), starts_at: input.starts_at || null, expires_at: input.expires_at || null, active: Boolean(input.active) }; if (!payload.code || !Number.isFinite(payload.discount_value) || payload.discount_value < 0) throw new Error("Código e valor de desconto são obrigatórios."); const client = getSupabaseServerClient(); const query = id ? client.from("coupons").update(payload).eq("id", id) : client.from("coupons").insert(payload); const { data, error } = await query.select(couponFields).single(); if (error) throw new Error("Não foi possível salvar o cupom."); return data; }

export async function deleteCoupon(id: string) {
  if (!id) throw new Error("Cupom não informado.");

  const client = getSupabaseServerClient();

  const { data: coupon, error: couponError } = await client
    .from("coupons")
    .select("id,code,used_count")
    .eq("id", id)
    .single();

  if (couponError || !coupon) {
    throw new Error("Cupom não encontrado.");
  }

  if (Number(coupon.used_count ?? 0) > 0) {
    throw new Error(
      "Este cupom já foi utilizado e não pode ser excluído. Desative o cupom para preservar o histórico dos pedidos.",
    );
  }

  const { count, error: ordersError } = await client
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("coupon_id", id);

  if (ordersError) {
    throw new Error("Não foi possível verificar o histórico do cupom.");
  }

  if ((count ?? 0) > 0) {
    throw new Error(
      "Este cupom possui pedidos vinculados e não pode ser excluído. Desative o cupom para preservar o histórico.",
    );
  }

  const { error } = await client
    .from("coupons")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error("Não foi possível excluir o cupom.");
  }

  return { id, code: coupon.code };
}

export async function listSettings() { const { data, error } = await getSupabaseServerClient().from("settings").select("key,value,description,created_at,updated_at").order("key"); if (error) throw new Error("Não foi possível carregar configurações."); return data ?? []; }
export async function updateSetting(key: string, value: string) { const { data, error } = await getSupabaseServerClient().from("settings").update({ value }).eq("key", key).select("key,value,description,updated_at").single(); if (error) throw new Error("Não foi possível atualizar a configuração."); return data; }
