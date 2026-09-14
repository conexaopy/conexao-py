"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { AdminNav } from "./AdminNav";

type Category = { id: string; name: string; slug: string; description: string | null; active: boolean; sort_order: number; product_count: number };
const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function AdminCategories() {
  const [items, setItems] = useState<Category[]>([]);
  const [form, setForm] = useState({ id: "", name: "", slug: "", description: "", active: true, sort_order: 0 });
  const [message, setMessage] = useState("");
  const load = useCallback(async () => { const response = await fetch("/api/admin/categories", { cache: "no-store" }); const result = await response.json(); if (response.ok) setItems(result.categories); else setMessage(result.error); }, []);
  useEffect(() => { void load(); }, [load]);
  const save = async (event: React.FormEvent) => { event.preventDefault(); const response = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); const result = await response.json(); setMessage(response.ok ? "Categoria salva." : result.error); if (response.ok) { setForm({ id: "", name: "", slug: "", description: "", active: true, sort_order: 0 }); await load(); } };
  const toggle = async (item: Category) => { const response = await fetch(`/api/admin/categories/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !item.active }) }); const result = await response.json(); setMessage(response.ok ? "Status atualizado." : result.error); if (response.ok) await load(); };
  return <main className="min-h-screen bg-[#090a0c] px-5 py-8 text-white lg:px-8"><div className="mx-auto max-w-7xl"><h1 className="text-4xl font-black">Categorias</h1><AdminNav /><form onSubmit={save} className="grid gap-4 rounded-2xl border border-white/10 bg-[#101216] p-6 md:grid-cols-4"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, slug: form.id ? form.slug : slugify(event.target.value) })} placeholder="Nome" required className="admin-input" /><input value={form.slug} onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })} placeholder="Slug" required className="admin-input" /><input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Descrição" className="admin-input" /><button className="rounded-lg bg-red-600 px-5 py-3 text-xs font-black">{form.id ? "ATUALIZAR" : "CRIAR CATEGORIA"}</button></form>{message && <p className="mt-4 text-sm text-zinc-400">{message}</p>}<div className="mt-8 grid gap-3">{items.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#101216] p-5"><div><p className="font-bold">{item.name}</p><p className="mt-1 text-xs text-zinc-500">{item.slug} · {item.product_count} produto(s) · {item.description || "Sem descrição"}</p></div><div className="flex items-center gap-3"><span className={item.active ? "text-emerald-400" : "text-zinc-600"}>{item.active ? "ATIVA" : "INATIVA"}</span><button onClick={() => setForm({ ...item, description: item.description ?? "" })} className="rounded border border-white/15 px-3 py-2 text-xs font-bold">EDITAR</button><button onClick={() => void toggle(item)} className="rounded border border-white/15 px-3 py-2 text-xs font-bold">{item.active ? "DESATIVAR" : "ATIVAR"}</button></div></div>)}</div></div></main>;
}
