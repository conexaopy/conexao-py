"use client";

import Link from "next/link";
import { useCart } from "../CartProvider";
import { formatPrice, type Product } from "../data";

export function ProductVisual({ product, large = false }: { product: Product; large?: boolean }) { return <div className={`product-visual relative flex items-end overflow-hidden rounded-xl border border-white/10 ${large ? "min-h-[420px]" : "aspect-[4/3]"}`} style={{ "--accent": product.accent, ...(product.imageUrl ? { backgroundImage: `linear-gradient(to top, rgba(9,10,12,.9), rgba(9,10,12,.1)), url(${product.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}) } as React.CSSProperties}><div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[var(--accent)] opacity-20 blur-3xl" /><div className="absolute bottom-4 left-5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">CONEXÃO PY / LAB</div><div className="relative z-10 flex w-full items-end justify-between p-5"><span className="text-5xl font-black italic tracking-tighter text-white/90">{product.category.slice(0, 2).toUpperCase()}</span><span className="rounded border border-white/20 bg-black/30 px-2 py-1 text-[10px] font-bold text-white/70">{product.presentation.split("|")[0]}</span></div></div> }

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <article className="group flex h-full flex-col">
      <Link href={`/produto/${product.slug}`}>
        <ProductVisual product={product} />
      </Link>

      <div className="flex flex-1 flex-col pt-4">
        <div className="mb-2 flex min-h-8 items-start justify-between gap-2">
          <span className="text-[10px] font-bold leading-4 tracking-wider text-red-400">
            {product.status}
          </span>
          <span className="text-right text-[10px] uppercase leading-4 text-zinc-600">
            {product.category}
          </span>
        </div>

        <Link href={`/produto/${product.slug}`}>
          <h3 className="min-h-10 font-bold leading-5 text-white group-hover:text-red-400">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1 text-xs text-zinc-500">
          {product.presentation}
        </p>

        <p
          className={`mt-3 text-[11px] font-bold ${
            product.available ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {product.available
            ? `${product.stockQuantity} ${
                product.stockQuantity === 1 ? "unidade disponível" : "unidades disponíveis"
              }`
            : "ESGOTADO"}
        </p>

        <div className="mt-auto flex min-h-16 items-end justify-between gap-2 pt-4">
          <div>
            <span className="text-sm font-black text-white">
              {formatPrice(product.price)}
            </span>

            {product.oldPrice && (
              <span className="ml-2 text-xs text-zinc-600 line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={!product.available}
            onClick={() => product.available && addItem(product)}
            className="shrink-0 rounded-lg bg-white px-3 py-2 text-[10px] font-black tracking-wider text-black transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"
          >
            {product.available ? "ADICIONAR" : "ESGOTADO"}
          </button>
        </div>
      </div>
    </article>
  );
}
