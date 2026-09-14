"use client";

import { useState } from "react";
import { formatPrice } from "../data";

type PublicOrder = { order_number: string; created_at: string; customer_name: string; status: string; total: number };

export function OrderLookup() {
  const [orderNumber, setOrderNumber] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState<PublicOrder | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    const response = await fetch("/api/order-lookup", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ orderNumber, identifier }) });
    const payload = await response.json();
    setResult(response.ok ? payload.order : null);
    if (!response.ok) setError(payload.error ?? "Não foi possível consultar o pedido.");
    setSearched(true);
    setLoading(false);
  };
  return <><form onSubmit={submit} className="mt-10 grid gap-4 rounded-2xl border border-white/10 bg-[#101216] p-6 md:grid-cols-[1fr_1fr_auto] md:items-end"><label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Número do pedido<input required value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="CPY-1001" className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-red-500" /></label><label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">CPF ou WhatsApp<input required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Sua identificação" className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-red-500" /></label><button disabled={loading} className="rounded-lg bg-red-600 px-5 py-3 text-xs font-black hover:bg-red-500 disabled:opacity-60">{loading ? "CONSULTANDO..." : "CONSULTAR PEDIDO"}</button></form>{searched && (result ? <div className="mt-10 rounded-2xl border border-emerald-500/20 bg-[#101216] p-6"><p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Pedido encontrado</p><div className="mt-4 flex flex-wrap justify-between gap-3"><div><p className="text-2xl font-black text-red-400">#{result.order_number}</p><p className="mt-2 text-sm text-zinc-400">{result.customer_name}</p></div><div className="text-right"><p className="text-xs uppercase tracking-widest text-zinc-500">Status</p><p className="mt-2 font-bold text-amber-300">{result.status}</p></div></div><p className="mt-5 border-t border-white/10 pt-5 text-sm text-zinc-400">Total do pedido: <strong className="text-white">{formatPrice(Number(result.total))}</strong></p></div> : <p className="mt-8 text-sm text-red-400">{error || "Não encontramos um pedido com esses dados. Confira o número e o CPF ou WhatsApp."}</p>)}</>;
}
