"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setLoading(true); setError(""); const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); const result = await response.json(); if (!response.ok) { setError(result.error ?? "Não foi possível entrar."); setLoading(false); return; } router.push("/admin/pedidos"); router.refresh(); };
  return <main className="flex min-h-screen items-center justify-center bg-[#090a0c] px-5"><form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101216] p-8"><p className="text-xs font-bold uppercase tracking-[.3em] text-red-500">Área restrita</p><h1 className="mt-4 text-3xl font-black">Painel CONEXÃO PY</h1><p className="mt-3 text-sm text-zinc-500">Entre com sua conta administrativa do Supabase.</p><div className="mt-8 grid gap-5"><label className="text-xs font-bold uppercase tracking-wider text-zinc-400">E-mail<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-red-500" /></label><label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Senha<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-red-500" /></label>{error && <p className="text-sm text-red-400">{error}</p>}<button disabled={loading} className="rounded-lg bg-red-600 px-5 py-4 text-xs font-black tracking-wider hover:bg-red-500 disabled:opacity-60">{loading ? "ENTRANDO..." : "ENTRAR NO PAINEL"}</button></div></form></main>;
}
