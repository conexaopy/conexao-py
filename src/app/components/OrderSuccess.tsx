"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "../data";
import { formatOrderDateTime, orderWhatsAppUrl } from "../whatsapp";
import type { Order } from "../orderTypes";

export function OrderSuccess({ order }: { order: Order }) {
  const [copied, setCopied] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState(
    "https:" + "//wa.me/" + "5545991294914"
  );

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

  const copy = async () => {
    await navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
  };

  const cpf = order.customer.cpf.replace(/\D/g, "");
  const formattedCpf =
    cpf.length === 11
      ? `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`
      : order.customer.cpf;

  const phone = order.customer.whatsapp.replace(/\D/g, "");
  const formattedPhone =
    phone.length === 11
      ? `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`
      : order.customer.whatsapp;

  const cep = order.address.cep.replace(/\D/g, "");
  const formattedCep =
    cep.length === 8
      ? `${cep.slice(0, 5)}-${cep.slice(5)}`
      : order.address.cep;

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-5xl px-5 py-16 lg:px-8">
      <div className="max-w-3xl">
        <span className="text-4xl text-emerald-400">✓</span>

        <p className="mt-6 text-xs font-bold uppercase tracking-[.3em] text-emerald-400">
          Tudo certo
        </p>

        <h1 className="mt-3 text-4xl font-black md:text-6xl">
          PEDIDO CRIADO COM SUCESSO
        </h1>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#101216]">
          <section className="p-6 md:p-8">
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-zinc-500">
                  Número
                </p>
                <p className="mt-2 text-3xl font-black text-red-400">
                  #{order.orderNumber}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-zinc-500">
                  Data e hora
                </p>
                <p className="mt-2 font-bold text-zinc-200">
                  {formatOrderDateTime(order.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-zinc-500">
                  Status
                </p>
                <p className="mt-2 font-black text-amber-300">
                  {order.status}
                </p>
              </div>
            </div>
          </section>

          <section className="border-t border-white/10 p-6 md:p-8">
            <h2 className="text-lg font-black">Dados do cliente</h2>

            <div className="mt-5 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
              <p>
                <span className="block text-xs uppercase tracking-wider text-zinc-500">
                  Nome
                </span>
                <span className="mt-1 block font-bold">{order.customer.name}</span>
              </p>

              <p>
                <span className="block text-xs uppercase tracking-wider text-zinc-500">
                  CPF
                </span>
                <span className="mt-1 block font-bold">{formattedCpf}</span>
              </p>

              <p>
                <span className="block text-xs uppercase tracking-wider text-zinc-500">
                  WhatsApp
                </span>
                <span className="mt-1 block font-bold">{formattedPhone}</span>
              </p>

              <p>
                <span className="block text-xs uppercase tracking-wider text-zinc-500">
                  E-mail
                </span>
                <span className="mt-1 block break-all font-bold">
                  {order.customer.email}
                </span>
              </p>
            </div>
          </section>

          <section className="border-t border-white/10 p-6 md:p-8">
            <h2 className="text-lg font-black">Endereço de entrega</h2>

            <div className="mt-5 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
              <p>
                <span className="block text-xs uppercase tracking-wider text-zinc-500">
                  Rua
                </span>
                <span className="mt-1 block font-bold">{order.address.street}</span>
              </p>

              <p>
                <span className="block text-xs uppercase tracking-wider text-zinc-500">
                  Número
                </span>
                <span className="mt-1 block font-bold">{order.address.number}</span>
              </p>

              <p>
                <span className="block text-xs uppercase tracking-wider text-zinc-500">
                  Complemento
                </span>
                <span className="mt-1 block font-bold">
                  {order.address.complement || "Não informado"}
                </span>
              </p>

              <p>
                <span className="block text-xs uppercase tracking-wider text-zinc-500">
                  Bairro
                </span>
                <span className="mt-1 block font-bold">
                  {order.address.neighborhood}
                </span>
              </p>

              <p>
                <span className="block text-xs uppercase tracking-wider text-zinc-500">
                  Cidade / Estado
                </span>
                <span className="mt-1 block font-bold">
                  {order.address.city}/{order.address.state}
                </span>
              </p>

              <p>
                <span className="block text-xs uppercase tracking-wider text-zinc-500">
                  CEP
                </span>
                <span className="mt-1 block font-bold">{formattedCep}</span>
              </p>
            </div>
          </section>

          <section className="border-t border-white/10 p-6 md:p-8">
            <h2 className="text-lg font-black">Itens do pedido</h2>

            <div className="mt-5 grid gap-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2 border-b border-white/10 pb-4 text-sm sm:grid-cols-[1fr_auto]"
                >
                  <div>
                    <p className="font-bold">
                      {item.quantity}x {item.name}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {item.presentation}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatPrice(item.price)} por unidade
                    </p>
                  </div>

                  <p className="font-black">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-white/10 p-6 md:p-8">
            <div className="ml-auto grid max-w-sm gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">Desconto</span>
                <span className="text-emerald-400">
                  -{formatPrice(order.discount)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">Envio</span>
                <span>
                  {order.shipping ? formatPrice(order.shipping) : "Grátis"}
                </span>
              </div>

              <div className="mt-2 flex justify-between border-t border-white/10 pt-4 text-xl font-black">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <a
            href={orderWhatsAppUrl(order, whatsappUrl)}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-[#25d366] px-4 py-4 text-center text-xs font-black text-black hover:bg-[#4ade80]"
          >
            FINALIZAR PELO WHATSAPP
          </a>

          <button
            onClick={copy}
            className="rounded-lg border border-white/20 px-4 py-4 text-xs font-black hover:bg-white hover:text-black"
          >
            {copied ? "NÚMERO COPIADO" : "COPIAR NÚMERO DO PEDIDO"}
          </button>

          <Link
            href="/"
            className="rounded-lg border border-white/20 px-4 py-4 text-center text-xs font-black hover:bg-white hover:text-black"
          >
            VOLTAR PARA A LOJA
          </Link>
        </div>
      </div>
    </main>
  );
}
