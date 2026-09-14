import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) throw new Error("Supabase server environment is incomplete.");

const client = createClient(url, secretKey);
const products = [
  { slug: "tirzepatida-10mg", name: "Tirzepatida Prime", category: "Tirzepatida", presentation: "10mg | Frasco-ampola", price: 389.9, oldPrice: 449.9, status: "OFERTA", description: "Apresentacao demonstrativa da linha Prime, com embalagem lacrada e rastreavel." },
  { slug: "tirzepatida-15mg", name: "Tirzepatida Ultra", category: "Tirzepatida", presentation: "15mg | Frasco-ampola", price: 469.9, status: "PRONTA ENTREGA", description: "Uma opcao premium da categoria Tirzepatida para seu protocolo personalizado." },
  { slug: "tirzepatida-kit", name: "Tirzepatida Kit Pro", category: "Tirzepatida", presentation: "Kit 3 frascos | 10mg", price: 899.9, status: "MAIS VENDIDO", description: "Kit demonstrativo com tres unidades da linha Tirzepatida." },
  { slug: "retatrutida-10mg", name: "Retatrutida Advance", category: "Retatrutida", presentation: "10mg | Frasco-ampola", price: 529.9, status: "NOVIDADE", description: "Novidade demonstrativa da Conexao PY, com design compacto e informacoes claras." },
  { slug: "retatrutida-15mg", name: "Retatrutida Black", category: "Retatrutida", presentation: "15mg | Frasco-ampola", price: 649.9, status: "SOB ENCOMENDA", description: "Linha Black para quem busca uma apresentacao diferenciada." },
  { slug: "retatrutida-kit", name: "Retatrutida Performance", category: "Retatrutida", presentation: "Kit 2 frascos | 15mg", price: 999.9, oldPrice: 1149.9, status: "OFERTA", description: "Kit demonstrativo com duas unidades em embalagem de colecao." },
  { slug: "bpc-157", name: "BPC-157 Recovery", category: "Peptídeos", presentation: "5mg | Frasco-ampola", price: 299.9, status: "PRONTA ENTREGA", description: "Apresentacao demonstrativa da linha Recovery de peptideos." },
  { slug: "cjc-ipamorelin", name: "CJC + Ipamorelin", category: "Peptídeos", presentation: "5mg + 5mg | Blend", price: 359.9, status: "MAIS VENDIDO", description: "Blend demonstrativo com visual limpo e acabamento premium." },
  { slug: "ghrp-6", name: "GHRP-6 Select", category: "Peptídeos", presentation: "5mg | Frasco-ampola", price: 279.9, status: "NOVIDADE", description: "Novidade demonstrativa com apresentacao pratica e objetiva." },
  { slug: "blend-testo", name: "Testo Blend 250", category: "Anabolizantes", presentation: "10ml | Multidosis", price: 319.9, status: "PRONTA ENTREGA", description: "Produto demonstrativo da linha Performance, com rotulo exclusivo." },
  { slug: "masteron", name: "Masteron Gold", category: "Anabolizantes", presentation: "10ml | Multidosis", price: 349.9, oldPrice: 399.9, status: "OFERTA", description: "Edicao demonstrativa Gold com embalagem de presenca marcante." },
  { slug: "deca-durabolin", name: "Deca Durabolin Pro", category: "Anabolizantes", presentation: "10ml | Multidosis", price: 379.9, status: "SOB ENCOMENDA", description: "Linha Pro demonstrativa para completar o catalogo Conexao PY." },
];

const { data: categories, error: categoryError } = await client.from("categories").select("id,name");
if (categoryError) throw new Error("Could not load Supabase categories.");
const categoryIds = new Map(categories.map((category) => [category.name, category.id]));

let inserted = 0;
let updated = 0;
for (const product of products) {
  const categoryId = categoryIds.get(product.category);
  if (!categoryId) throw new Error(`Missing category mapping for ${product.category}.`);
  const stockQuantity = product.status === "SOB ENCOMENDA" ? 0 : 10;
  const payload = {
    category_id: categoryId,
    sku: product.slug,
    slug: product.slug,
    name: product.name,
    presentation: product.presentation,
    description: product.description,
    price: product.oldPrice ?? product.price,
    promo_price: product.oldPrice ? product.price : null,
    stock_quantity: stockQuantity,
    status: product.status,
    image_url: null,
    gallery: [],
    active: true,
    featured: false,
    bestseller: product.status === "MAIS VENDIDO",
    is_new: product.status === "NOVIDADE",
  };
  const { data: existing, error: lookupError } = await client.from("products").select("id").or(`slug.eq.${product.slug},sku.eq.${product.slug}`).limit(1).maybeSingle();
  if (lookupError) throw new Error(`Could not check product ${product.slug}.`);
  if (existing) {
    const { error } = await client.from("products").update(payload).eq("id", existing.id);
    if (error) throw new Error(`Could not update product ${product.slug}.`);
    updated += 1;
  } else {
    const { error } = await client.from("products").insert(payload);
    if (error) throw new Error(`Could not insert product ${product.slug}.`);
    inserted += 1;
  }
}

const { count, error: countError } = await client.from("products").select("id", { count: "exact", head: true }).eq("active", true);
if (countError) throw new Error("Could not count active products.");
console.log(JSON.stringify({ migrated: products.length, inserted, updated, activeProducts: count }));
