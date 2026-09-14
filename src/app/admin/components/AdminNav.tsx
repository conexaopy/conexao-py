"use client";

import Link from "next/link";

const links = [["Dashboard", "/admin"], ["Pedidos", "/admin/pedidos"], ["Produtos", "/admin/produtos"], ["Categorias", "/admin/categorias"], ["Cupons", "/admin/cupons"], ["Configurações", "/admin/configuracoes"]];

export function AdminNav() { return <nav className="mb-8 flex gap-2 overflow-x-auto border-b border-white/10 pb-4">{links.map(([label, href]) => <Link key={label} href={href} className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-zinc-400 transition hover:bg-white/5 hover:text-white">{label}</Link>)}</nav>; }
