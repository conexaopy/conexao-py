"use client";

import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "../data";
import { formatOrderDateTime, orderWhatsAppUrl } from "../whatsapp";
import type { Order } from "../orderTypes";

export function OrderSuccess({ order }: { order: Order }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
  };

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-5xl px-5 py-16 lg:px-8">
      <div className="max-w-2xl">
        <span className="text-4xl text-emerald-400">✓</span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[.3em] text-emerald-400">Tudo certo</p>
        <h1 className="mt-3 text-4xl font-black md:text-6xl">PEDIDO CRIADO COM SUCESSO</h1>
        <div className="mt-8 rounded-2xl border border-white/10 bg-[#101216] p-6 md:p-8">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Número</p>
          <p className="mt-2 text-3xl font-black text-red-400">#{order.orderNumber}</p>
          <p className="mt-6 text-xs uppercase tracking-widest text-zinc-500">Data e hora</p>
          <p className="mt-2 text-sm text-zinc-300">{formatOrderDateTime(order.createdAt)}</p>
          <p className="mt-6 text-xs uppercase tracking-widest text-zinc-500">Status</p>
          <p className="mt-2 font-bold text-amber-300">{order.status}</p>
          <div className="mt-7 grid gap-4 border-t border-white/10 pt-6 text-sm">
            <p><span className="text-zinc-500">Cliente:</span> {order.customer.name}</p>
            <p><span className="text-zinc-500">Entrega:</span> {order.address.street}, {order.address.number} - {order.address.city}/{order.address.state}</p>
            <div className="flex justify-between border-t border-white/10 pt-4 text-lg font-black"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <a href={orderWhatsAppUrl(order)} target="_blank" rel="noreferrer" className="rounded-lg bg-[#25d366] px-4 py-4 text-center text-xs font-black text-black hover:bg-[#4ade80]">FINALIZAR PELO WHATSAPP</a>
          <button onClick={copy} className="rounded-lg border border-white/20 px-4 py-4 text-xs font-black hover:bg-white hover:text-black">{copied ? "NÚMERO COPIADO" : "COPIAR NÚMERO DO PEDIDO"}</button>
          <Link href="/" className="rounded-lg border border-white/20 px-4 py-4 text-center text-xs font-black hover:bg-white hover:text-black">VOLTAR PARA A LOJA</Link>
        </div>
        <div className="mt-10 border-t border-white/10 pt-8">
          <h2 className="font-black">Itens do pedido</h2>
          <div className="mt-4 grid gap-3 text-sm text-zinc-400">{order.items.map((item) => <div key={item.id} className="flex justify-between"><span>{item.quantity}x {item.name}</span><span>{formatPrice(item.price * item.quantity)}</span></div>)}</div>
        </div>
      </div>
    </main>
  );
}
