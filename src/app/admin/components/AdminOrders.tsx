"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "../../orderTypes";

const statuses: OrderStatus[] = ["AGUARDANDO PAGAMENTO", "PAGAMENTO CONFIRMADO", "PRODUTO CONFIRMADO", "PREPARANDO ENVIO", "ENVIADO", "RASTREIO DISPONÍVEL", "ENTREGUE", "CANCELADO"];
type AdminOrder = { id: string; order_number: string; created_at: string; customer_name: string; customer_whatsapp: string; delivery_city: string; delivery_state: string; status: OrderStatus; total: number };
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const date = (value: string) => new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

const statusClass = (status: OrderStatus) => {
  switch (status) {
    case "AGUARDANDO PAGAMENTO":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "PAGAMENTO CONFIRMADO":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "PRODUTO CONFIRMADO":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-400";
    case "PREPARANDO ENVIO":
      return "border-violet-500/30 bg-violet-500/10 text-violet-400";
    case "ENVIADO":
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";
    case "RASTREIO DISPONÍVEL":
      return "border-sky-500/30 bg-sky-500/10 text-sky-400";
    case "ENTREGUE":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "CANCELADO":
      return "border-red-500/30 bg-red-500/10 text-red-400";
    default:
      return "border-white/10 text-zinc-400";
  }
};

export function AdminOrders() { const router = useRouter(); const [orders, setOrders] = useState<AdminOrder[]>([]); const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const load = useCallback(async () => { setLoading(true); const params = new URLSearchParams(); if (search) params.set("search", search); if (status) params.set("status", status); const response = await fetch(`/api/admin/orders?${params}`); const result = await response.json(); if (!response.ok) setError(result.error ?? "Falha ao carregar pedidos."); else { setError(""); setOrders(result.orders); } setLoading(false); }, [search, status]); useEffect(() => { const frame = window.requestAnimationFrame(() => { void load(); }); return () => window.cancelAnimationFrame(frame); }, [load]); const logout = async () => { await fetch("/api/admin/logout", { method: "POST" }); router.push("/admin/login"); }; return <main className="min-h-screen bg-[#090a0c] px-5 py-8 text-white lg:px-8"><div className="mx-auto max-w-7xl"><header className="flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-8"><div><p className="text-xs font-bold uppercase tracking-[.3em] text-red-500">Operação</p><h1 className="mt-3 text-4xl font-black">Pedidos</h1><p className="mt-2 text-sm text-zinc-500">Gestão segura da operação CONEXÃO PY.</p></div><div className="flex gap-3"><Link href="/" className="rounded-lg border border-white/15 px-4 py-3 text-xs font-bold">Ver loja</Link><button onClick={logout} className="rounded-lg border border-white/15 px-4 py-3 text-xs font-bold text-zinc-400">Sair</button></div></header><section className="mt-8 flex flex-col gap-3 md:flex-row"><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void load(); }} placeholder="Buscar número, nome, CPF ou WhatsApp" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#101216] px-4 py-3 text-sm outline-none focus:border-red-500" /><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-white/10 bg-[#101216] px-4 py-3 text-sm text-white outline-none"><option value="">Todos os status</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select><button onClick={() => void load()} className="rounded-lg bg-red-600 px-5 py-3 text-xs font-black">BUSCAR</button></section>{error && <p className="mt-6 text-sm text-red-400">{error}</p>}{!loading && <section className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/10 bg-[#101216] p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Pedidos encontrados</p><p className="mt-2 text-2xl font-black">{orders.length}</p></div><div className="rounded-xl border border-white/10 bg-[#101216] p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Valor dos pedidos exibidos</p><p className="mt-2 text-2xl font-black text-emerald-400">{money(orders.reduce((total, order) => total + Number(order.total), 0))}</p></div></section>}{loading ? <p className="mt-12 text-sm text-zinc-500">Carregando pedidos...</p> : <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#101216] text-xs uppercase tracking-wider text-zinc-500"><tr><th className="px-5 py-4">Pedido</th><th className="px-5 py-4">Data/hora</th><th className="px-5 py-4">Cliente</th><th className="px-5 py-4">WhatsApp</th><th className="px-5 py-4">Localidade</th><th className="px-5 py-4">Total</th><th className="px-5 py-4">Status</th></tr></thead><tbody className="divide-y divide-white/10">{orders.map((order) => <tr key={order.id} onClick={() => router.push(`/admin/pedidos/${order.id}`)} className="cursor-pointer transition hover:bg-white/[.05]"><td className="px-5 py-4 font-bold"><Link href={`/admin/pedidos/${order.id}`} className="text-red-400 hover:text-red-300">#{order.order_number}</Link></td><td className="px-5 py-4 text-zinc-400">{date(order.created_at)}</td><td className="px-5 py-4">{order.customer_name}</td><td className="px-5 py-4 text-zinc-400">{order.customer_whatsapp}</td><td className="px-5 py-4 text-zinc-400">{order.delivery_city}/{order.delivery_state}</td><td className="px-5 py-4 font-bold">{money(Number(order.total))}</td><td className="px-5 py-4"><span className={`whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-bold ${statusClass(order.status)}`}>{order.status}</span></td></tr>)}</tbody></table>{!orders.length && <p className="p-10 text-center text-sm text-zinc-500">Nenhum pedido encontrado.</p>}</div>}</div></main>; }
