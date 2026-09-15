"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "../CartProvider";

const links = ["Tirzepatida", "Retatrutida", "Peptídeos", "Anabolizantes"];

const DEFAULT_WHATSAPP =
  "https:" + "//wa.me/" + "5545991294914";

export function Header() {
  const [open, setOpen] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState(DEFAULT_WHATSAPP);

  const { totalItems, hydrated } = useCart();

  useEffect(() => {
    void fetch("/api/store-settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (
          typeof data.whatsappUrl === "string" &&
          data.whatsappUrl.startsWith("https://")
        ) {
          setWhatsappUrl(data.whatsappUrl);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090a0c]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center gap-4 px-5 lg:px-8">
        <Link
          href="/"
          className="shrink-0 text-base font-black tracking-[0.14em] text-white sm:text-lg"
        >
          CONEXÃO<span className="text-red-500">PY</span>
          <span className="ml-2 hidden text-[9px] tracking-normal text-zinc-500 sm:inline">
            STORE
          </span>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-5 lg:flex xl:gap-7">
          <Link
            className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white"
            href="/#catalogo"
          >
            Produtos
          </Link>

          {links.map((link) => (
            <Link
              key={link}
              className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white"
              href={`/?categoria=${encodeURIComponent(link)}#catalogo`}
            >
              {link}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/acompanhar-pedido"
            className="hidden whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white xl:block"
          >
            Acompanhar pedido
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-full border border-red-500/50 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-red-400 transition hover:bg-red-500 hover:text-white lg:block"
          >
            WhatsApp
          </a>

          <Link
            href="/carrinho"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-base hover:border-white/40"
            aria-label="Abrir carrinho"
          >
            🛒
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold">
              {hydrated ? totalItems : 0}
            </span>
          </Link>

          <button
            onClick={() => setOpen(!open)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-xl text-white lg:hidden"
            aria-label="Abrir menu"
          >
            {open ? "×" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#0d0f12] px-5 py-5 lg:hidden">
          <nav className="grid gap-4">
            <Link
              href="/#catalogo"
              onClick={() => setOpen(false)}
              className="text-sm font-bold uppercase"
            >
              Produtos
            </Link>

            {links.map((link) => (
              <Link
                key={link}
                href={`/?categoria=${encodeURIComponent(link)}#catalogo`}
                onClick={() => setOpen(false)}
                className="text-sm font-bold uppercase text-zinc-400"
              >
                {link}
              </Link>
            ))}

            <Link
              href="/acompanhar-pedido"
              onClick={() => setOpen(false)}
              className="text-sm font-bold uppercase text-zinc-400"
            >
              Acompanhar Pedido
            </Link>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold uppercase text-red-400"
            >
              WhatsApp
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
