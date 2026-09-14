import "server-only";

import type { Product } from "../../app/data";
import { getSupabaseServerClient } from "./server";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  presentation: string | null;
  description: string | null;
  price: number | string;
  promo_price: number | string | null;
  stock_quantity: number | null;
  status: string | null;
  image_url: string | null;
  gallery: unknown;
  active: boolean;
  featured: boolean;
  bestseller: boolean;
  is_new: boolean;
  category: { name: string; slug: string } | { name: string; slug: string }[] | null;
};

const accents = ["#d93636", "#3c82c4", "#198b83", "#d97706", "#7c3aed"];

function categoryName(category: ProductRow["category"]): string {
  return Array.isArray(category) ? category[0]?.name ?? "Produtos" : category?.name ?? "Produtos";
}

function galleryUrls(gallery: unknown): string[] {
  if (!Array.isArray(gallery)) return [];
  return gallery.filter((item): item is string => typeof item === "string");
}

function mapProduct(row: ProductRow, index: number): Product {
  const stockQuantity = row.stock_quantity ?? 0;
  const gallery = galleryUrls(row.gallery);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: categoryName(row.category),
    presentation: row.presentation ?? "Apresentação não informada",
    price: Number(row.promo_price ?? row.price ?? 0),
    oldPrice: row.promo_price != null ? Number(row.price) : undefined,
    status: row.status ?? (stockQuantity > 0 ? "PRONTA ENTREGA" : "SOB ENCOMENDA"),
    description: row.description ?? "Descrição não informada.",
    accent: accents[index % accents.length],
    imageUrl: row.image_url ?? undefined,
    gallery,
    stockQuantity,
    available: stockQuantity > 0,
    featured: row.featured,
    bestseller: row.bestseller,
    isNew: row.is_new,
  };
}

export async function getCatalogProducts(): Promise<Product[]> {
  const { data, error } = await getSupabaseServerClient()
    .from("products")
    .select("id,slug,name,presentation,description,price,promo_price,stock_quantity,status,image_url,gallery,active,featured,bestseller,is_new,category:categories(name,slug)")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[catalog] Supabase products query failed", { code: error.code, message: error.message, details: error.details, hint: error.hint });
    throw new Error("Não foi possível carregar o catálogo do Supabase.");
  }
  return ((data ?? []) as ProductRow[]).map(mapProduct);
}

export async function getCatalogProduct(slug: string): Promise<Product | undefined> {
  const { data, error } = await getSupabaseServerClient()
    .from("products")
    .select("id,slug,name,presentation,description,price,promo_price,stock_quantity,status,image_url,gallery,active,featured,bestseller,is_new,category:categories(name,slug)")
    .eq("active", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[catalog] Supabase product query failed", { code: error.code, message: error.message, details: error.details, hint: error.hint });
    throw new Error("Não foi possível carregar o produto do Supabase.");
  }
  return data ? mapProduct(data as ProductRow, 0) : undefined;
}
