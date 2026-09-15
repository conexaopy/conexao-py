import "server-only";

import { getSupabaseServerClient } from "./server";

export const productStatuses = ["PRONTA ENTREGA", "SOB ENCOMENDA", "OFERTA", "NOVIDADE", "MAIS VENDIDO"] as const;
type ProductInput = { name: string; slug: string; sku: string; category_id: string; presentation: string; description: string; price: number; promo_price: number | null; stock_quantity: number; status: string; image_url: string | null; active: boolean; featured: boolean; bestseller: boolean; is_new: boolean };
const fields = "id,slug,sku,name,category_id,presentation,description,price,promo_price,stock_quantity,status,image_url,gallery,active,featured,bestseller,is_new,created_at,updated_at,category:categories(name,slug)";

function validateInput(input: ProductInput) {
  if (!input.name.trim() || !input.slug.trim() || !input.category_id) throw new Error("Nome, slug e categoria são obrigatórios.");
  if (!Number.isFinite(input.price) || input.price <= 0) throw new Error("O preço deve ser positivo.");
  if (input.promo_price !== null && (!Number.isFinite(input.promo_price) || input.promo_price < 0)) throw new Error("O preço promocional não pode ser negativo.");
  if (!Number.isInteger(input.stock_quantity) || input.stock_quantity < 0) throw new Error("O estoque deve ser um inteiro maior ou igual a zero.");
  if (!productStatuses.includes(input.status as typeof productStatuses[number])) throw new Error("Status de produto inválido.");
}

function cleanInput(body: Partial<ProductInput>): ProductInput {
  const price = Number(body.price);
  const promo = body.promo_price === null || body.promo_price === undefined || (body.promo_price as unknown) === "" ? null : Number(body.promo_price);
  return { name: String(body.name ?? "").trim(), slug: String(body.slug ?? "").trim().toLowerCase(), sku: String(body.sku ?? "").trim(), category_id: String(body.category_id ?? ""), presentation: String(body.presentation ?? "").trim(), description: String(body.description ?? "").trim(), price, promo_price: promo, stock_quantity: Number(body.stock_quantity), status: String(body.status ?? "PRONTA ENTREGA"), image_url: body.image_url ? String(body.image_url).trim() : null, active: Boolean(body.active), featured: Boolean(body.featured), bestseller: Boolean(body.bestseller), is_new: Boolean(body.is_new) };
}

async function ensureUnique(input: ProductInput, id?: string) {
  const client = getSupabaseServerClient();
  const query = client.from("products").select("id,slug,sku").or(`slug.eq.${input.slug},sku.eq.${input.sku || "__empty_sku__"}`);
  const { data, error } = await query;
  if (error) throw new Error("Não foi possível validar slug e SKU.");
  const duplicate = (data ?? []).find((row) => row.id !== id && (row.slug === input.slug || (input.sku && row.sku === input.sku)));
  if (duplicate) throw new Error(duplicate.slug === input.slug ? "Este slug já está em uso." : "Este SKU já está em uso.");
}

export async function listAdminProducts(filters: { search?: string; category?: string; active?: string; status?: string; featured?: string }) {
  const client = getSupabaseServerClient();
  let query = client.from("products").select(fields).order("updated_at", { ascending: false });
  if (filters.category) query = query.eq("category_id", filters.category);
  if (filters.active === "true" || filters.active === "false") query = query.eq("active", filters.active === "true");
  if (filters.featured === "true" || filters.featured === "false") query = query.eq("featured", filters.featured === "true");
  if (filters.status && productStatuses.includes(filters.status as typeof productStatuses[number])) query = query.eq("status", filters.status);
  if (filters.search?.trim()) { const term = filters.search.trim().replace(/[(),]/g, ""); query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%,sku.ilike.%${term}%`); }
  const { data, error } = await query;
  if (error) throw new Error("Não foi possível carregar os produtos.");
  return data ?? [];
}

export async function getAdminProduct(id: string) {
  const { data, error } = await getSupabaseServerClient().from("products").select(fields).eq("id", id).maybeSingle();
  if (error) throw new Error("Não foi possível carregar o produto.");
  return data;
}

export async function getAdminProductOptions() {
  const { data, error } = await getSupabaseServerClient().from("categories").select("id,name,slug").eq("active", true).order("sort_order");
  if (error) throw new Error("Não foi possível carregar as categorias.");
  return data ?? [];
}

export async function createAdminProduct(body: Partial<ProductInput>) {
  const input = cleanInput(body);
  if (!input.sku) input.sku = `SKU-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  validateInput(input);
  await ensureUnique(input);
  const { data, error } = await getSupabaseServerClient().from("products").insert({ ...input, gallery: [] }).select(fields).single();
  if (error) throw new Error("Não foi possível criar o produto.");
  return data;
}

export async function updateAdminProduct(id: string, body: Partial<ProductInput>) {
  const input = cleanInput(body);
  if (!input.sku) input.sku = `SKU-${id.slice(0, 8).toUpperCase()}`;
  validateInput(input);
  await ensureUnique(input, id);
  const { data, error } = await getSupabaseServerClient().from("products").update(input).eq("id", id).select(fields).single();
  if (error) throw new Error("Não foi possível atualizar o produto.");
  return data;
}

export async function bulkUpdateAdminProducts(
  ids: string[],
  changes: {
    active?: boolean;
    stock_quantity?: number;
  },
) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error("Selecione pelo menos um produto.");
  }

  const uniqueIds = [...new Set(ids.filter(Boolean))];

  if (uniqueIds.length === 0) {
    throw new Error("Nenhum produto válido foi selecionado.");
  }

  const update: {
    active?: boolean;
    stock_quantity?: number;
  } = {};

  if (typeof changes.active === "boolean") {
    update.active = changes.active;
  }

  if (changes.stock_quantity !== undefined) {
    const stock = Number(changes.stock_quantity);

    if (!Number.isInteger(stock) || stock < 0) {
      throw new Error("O estoque deve ser um inteiro maior ou igual a zero.");
    }

    update.stock_quantity = stock;
  }

  if (Object.keys(update).length === 0) {
    throw new Error("Nenhuma alteração foi informada.");
  }

  const { data, error } = await getSupabaseServerClient()
    .from("products")
    .update(update)
    .in("id", uniqueIds)
    .select("id,active,stock_quantity");

  if (error) {
    throw new Error("Não foi possível atualizar os produtos selecionados.");
  }

  return data ?? [];
}
