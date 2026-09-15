"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DEFAULT_WHATSAPP =
  "https:" + "//wa.me/" + "5545991294914";

const DEFAULT_GROUP =
  "https:" +
  "//chat.whatsapp.com/" +
  "GPkNMzZbMPFGigAQXTC6iT?s=cl&p=a&mlu=4&ilr=4";

export function Footer() {
  const [whatsappUrl, setWhatsappUrl] = useState(DEFAULT_WHATSAPP);
  const [whatsappGroupUrl, setWhatsappGroupUrl] = useState(DEFAULT_GROUP);

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

        if (
          typeof data.whatsappGroupUrl === "string" &&
          data.whatsappGroupUrl.startsWith("https://")
        ) {
          setWhatsappGroupUrl(data.whatsappGroupUrl);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-white/10 bg-[#070809] px-5 pb-8 pt-14 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <div className="text-lg font-black tracking-[0.18em]">
            CONEXÃO <span className="text-red-500">PY</span>
          </div>

          <p className="mt-4 max-w-xs text-sm leading-6 text-zinc-500">
            Produtos, novidades e atendimento em um só lugar.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white">
            Loja
          </h3>

          <div className="mt-4 grid gap-3 text-sm text-zinc-500">
            <Link href="/#catalogo">Todos os produtos</Link>

            <a
              href={whatsappGroupUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Grupo da Conexão PY
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white">
            Pedidos
          </h3>

          <div className="mt-4 grid gap-3 text-sm text-zinc-500">
            <Link href="/acompanhar-pedido">Acompanhar pedido</Link>
            <Link href="/carrinho">Carrinho</Link>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white">
            Atendimento
          </h3>

          <div className="mt-4 grid gap-3 text-sm text-zinc-500">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>

            <a
              href={whatsappGroupUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Grupo da Conexão PY
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-7xl border-t border-white/10 pt-6 text-xs text-zinc-600">
        © 2026 CONEXÃO PY. Todos os direitos reservados.
      </div>
    </footer>
  );
}
