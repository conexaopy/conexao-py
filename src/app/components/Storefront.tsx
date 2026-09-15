"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "../data";
import { ProductCard } from "./ProductCard";

const categories = ["Todos", "Tirzepatida", "Retatrutida", "Peptídeos", "Anabolizantes"] as const;

export function Storefront({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const requestedCategory = searchParams.get("categoria");

  const urlCategory =
    categories.find(
      (category) =>
        category !== "Todos" &&
        category.toLocaleLowerCase("pt-BR") ===
          requestedCategory?.toLocaleLowerCase("pt-BR"),
    ) ?? "Todos";

  const [manualCategory, setManualCategory] =
    useState<typeof categories[number] | null>(null);

  const active = requestedCategory ? urlCategory : (manualCategory ?? "Todos");

  const setActive = (category: typeof categories[number]) => {
    setManualCategory(category);
  };

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [sort, setSort] = useState("default");
  const [whatsappGroupUrl, setWhatsappGroupUrl] = useState(
    "https:" + "//chat.whatsapp.com/" + "GPkNMzZbMPFGigAQXTC6iT?s=cl&p=a&mlu=4&ilr=4"
  );

  useEffect(() => {
    void fetch("/api/store-settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (
          typeof data.whatsappGroupUrl === "string" &&
          data.whatsappGroupUrl.startsWith("https://")
        ) {
          setWhatsappGroupUrl(data.whatsappGroupUrl);
        }
      })
      .catch(() => {});
  }, []);

  const statuses = useMemo(
    () => ["Todos", ...Array.from(new Set(products.map((product) => product.status))).sort()],
    [products]
  );
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    const result = products.filter((product) => {
      const matchesCategory =
        active === "Todos" || product.category === active;

      const matchesStatus =
        status === "Todos" || product.status === status;

      const matchesSearch =
        !term ||
        `${product.name} ${product.category} ${product.presentation} ${product.status}`
          .toLowerCase()
          .includes(term);

      return matchesCategory && matchesStatus && matchesSearch;
    });

    if (sort === "price-asc") {
      return [...result].sort((a, b) => a.price - b.price);
    }

    if (sort === "price-desc") {
      return [...result].sort((a, b) => b.price - a.price);
    }

    if (sort === "name") {
      return [...result].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR")
      );
    }

    return result;
  }, [active, products, search, sort, status]);
  return <><section className="relative overflow-hidden border-b border-white/10 bg-[#101216] px-5 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24"><div className="grid-lines absolute inset-0 opacity-40" /><div className="relative mx-auto grid max-w-7xl items-end gap-12 lg:grid-cols-[1.1fr_.9fr]"><div><p className="mb-5 text-xs font-bold uppercase tracking-[0.35em] text-red-500">Loja oficial / 2026</p><h1 className="max-w-3xl text-5xl font-black leading-[.95] tracking-tight text-white md:text-7xl lg:text-8xl">CONEXÃO <span className="text-red-500">PY</span></h1><p className="mt-7 max-w-lg text-base leading-7 text-zinc-400 md:text-lg">Produtos, novidades e atendimento em um só lugar.</p><a href="#catalogo" className="mt-9 inline-flex rounded-lg bg-red-600 px-6 py-4 text-xs font-black tracking-[0.15em] text-white transition hover:bg-red-500">VER PRODUTOS <span className="ml-5">↘</span></a></div><div className="relative hidden min-h-[280px] overflow-hidden rounded-2xl border border-white/10 bg-[#16191e] p-7 lg:block"><div className="absolute -right-10 -top-16 h-72 w-72 rounded-full border-[38px] border-red-600/20" /><div className="absolute bottom-6 left-7 text-xs uppercase tracking-[.25em] text-zinc-500">Seleção premium<br /><span className="mt-2 block text-white">Novidades toda semana</span></div><span className="absolute right-8 top-8 text-7xl font-black italic text-white/5">PY</span></div></div></section><main id="catalogo" className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end"><div><p className="mb-3 text-xs font-bold uppercase tracking-[.3em] text-red-500">Curadoria Conexão</p><h2 className="text-3xl font-black tracking-tight md:text-4xl">Encontre seu próximo produto</h2></div><div className="flex w-full max-w-xs items-center border-b border-white/20 pb-2"><span className="mr-3 text-zinc-500">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar produto..." className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600" /></div></div><div className="mt-8 flex gap-2 overflow-x-auto pb-2">{categories.map((category) => <button key={category} onClick={() => setActive(category)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${active === category ? "border-red-500 bg-red-600 text-white" : "border-white/15 text-zinc-400 hover:border-white/40 hover:text-white"}`}>{category}</button>)}</div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-white/15 bg-[#101216] px-4 py-3 text-sm text-white outline-none focus:border-red-500"><option value="Todos">Todos os status</option>{statuses.filter((item) => item !== "Todos").map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-white/15 bg-[#101216] px-4 py-3 text-sm text-white outline-none focus:border-red-500"><option value="default">Ordenação padrão</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option><option value="name">Nome A-Z</option></select><div className="flex items-center text-xs font-bold uppercase tracking-wider text-zinc-500">{filtered.length} produto{filtered.length === 1 ? "" : "s"} encontrado{filtered.length === 1 ? "" : "s"}</div></div><div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div>{filtered.length === 0 && <p className="py-20 text-center text-zinc-500">Nenhum produto encontrado.</p>}<section id="grupo" className="mt-24 overflow-hidden rounded-2xl border border-blue-500/20 bg-[#111820] p-8 md:p-12"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.3em] text-blue-400">Comunidade PY</p><h2 className="mt-4 text-3xl font-black md:text-5xl">ENTRE NO GRUPO DA CONEXÃO PY</h2><p className="mt-5 text-zinc-400">Acompanhe novidades, reposições, produtos e atualizações.</p><a href={whatsappGroupUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-block rounded-lg bg-blue-500 px-5 py-3 text-xs font-black tracking-wider text-white hover:bg-blue-400">ENTRAR NO GRUPO ↗</a></div></section></main></>;
}
