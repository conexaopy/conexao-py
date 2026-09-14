"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "../CartProvider";
import { formatPrice, type Product } from "../data";
import { ProductCard, ProductVisual } from "./ProductCard";

export function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const add = () => { for (let index = 0; index < quantity; index += 1) addItem(product); };
  return <><div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-16"><Link href="/#catalogo" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white">← Voltar para produtos</Link><div className="mt-8 grid gap-10 lg:grid-cols-2"><ProductVisual product={product} large /><div className="py-2"><p className="text-xs font-bold uppercase tracking-[.25em] text-red-400">{product.category}</p><h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{product.name}</h1><p className="mt-4 text-zinc-400">{product.presentation}</p><div className="mt-8 border-y border-white/10 py-6"><span className="text-3xl font-black">{formatPrice(product.price)}</span>{product.oldPrice && <span className="ml-3 text-sm text-zinc-600 line-through">{formatPrice(product.oldPrice)}</span>}<p className="mt-3 text-xs font-bold uppercase tracking-wider text-emerald-400">{product.status}</p></div><p className="mt-7 leading-7 text-zinc-400">{product.description}</p><div className="mt-8 flex items-center gap-3"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-11 w-11 rounded-lg border border-white/15">−</button><span className="w-8 text-center font-bold">{quantity}</span><button onClick={() => setQuantity(quantity + 1)} className="h-11 w-11 rounded-lg border border-white/15">+</button></div><div className="mt-5 flex flex-col gap-3 sm:flex-row"><button onClick={add} className="rounded-lg bg-red-600 px-6 py-4 text-xs font-black tracking-wider hover:bg-red-500">ADICIONAR AO CARRINHO</button><Link href="/carrinho" onClick={add} className="rounded-lg border border-white/20 px-6 py-4 text-center text-xs font-black tracking-wider hover:bg-white hover:text-black">COMPRAR AGORA</Link></div></div></div><div className="mt-20 border-t border-white/10 pt-10"><h2 className="text-2xl font-black">Produtos relacionados</h2><div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></div></div></>;
}
