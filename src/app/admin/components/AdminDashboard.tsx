"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AdminNav } from "./AdminNav";

const money = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const date = (value: string) =>
  new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

type SearchOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_cpf?: string;
  total: number;
  status: string;
  created_at: string;
};

export function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  const [cpf, setCpf] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState<SearchOrder[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void fetch("/api/admin/dashboard", {
        cache: "no-store",
      }).then(async (response) => {
        const result = await response.json();

        if (!response.ok) {
          setError(result.error);
        } else {
          setData(result);
        }
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const searchByCpf = async (event: FormEvent) => {
    event.preventDefault();

    const digits = cpf.replace(/\D/g, "");

    if (digits.length !== 11) {
      setSearchError("Digite um CPF válido com 11 números.");
      setSearchResults([]);
      setHasSearched(true);
      return;
    }

    setSearching(true);
    setSearchError("");
    setSearchResults([]);
    setHasSearched(false);

    try {
      const response = await fetch(
        `/api/admin/orders?search=${encodeURIComponent(digits)}`,
        {
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Não foi possível localizar os pedidos.",
        );
      }

      setSearchResults(
        Array.isArray(result.orders) ? result.orders : [],
      );
      setHasSearched(true);
    } catch (requestError) {
      setSearchError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível localizar os pedidos.",
      );
      setHasSearched(true);
    } finally {
      setSearching(false);
    }
  };

  if (error) {
    return (
      <main className="min-h-screen bg-[#090a0c] p-8 text-red-400">
        {error}
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#090a0c] p-8 text-zinc-400">
        Carregando dashboard...
      </main>
    );
  }

  const metrics = [
    ["Pedidos", data.metrics.totalOrders],
    ["Aguardando pagamento", data.metrics.awaiting],
    ["Pagamento confirmado", data.metrics.confirmed],
    ["Enviados", data.metrics.shipped],
    ["Entregues", data.metrics.delivered],
    ["Produtos ativos", data.metrics.activeProducts],
    ["Clientes", data.metrics.customers],
    ["Faturamento válido", money(data.metrics.revenue)],
  ];

  return (
    <main className="min-h-screen bg-[#090a0c] px-5 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-white/10 pb-8">
          <p className="text-xs font-bold uppercase tracking-[.3em] text-red-500">
            Operação
          </p>

          <h1 className="mt-3 text-4xl font-black">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Visão geral da CONEXÃO PY.
          </p>
        </header>

        <AdminNav />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-white/10 bg-[#101216] p-5"
            >
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                {label}
              </p>

              <p className="mt-3 text-2xl font-black">
                {value}
              </p>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#101216] p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.25em] text-red-500">
              Atendimento
            </p>

            <h2 className="mt-2 text-xl font-black">
              Localizar pedido por CPF
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Digite o CPF do cliente para localizar todos os pedidos vinculados a ele.
            </p>
          </div>

          <form
            onSubmit={searchByCpf}
            className="mt-5 flex max-w-2xl flex-col gap-3 sm:flex-row"
          >
            <input
              value={cpf}
              onChange={(event) => {
                setCpf(event.target.value);
                setSearchError("");
              }}
              inputMode="numeric"
              placeholder="Digite o CPF do cliente"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500"
            />

            <button
              type="submit"
              disabled={searching}
              className="rounded-lg bg-red-600 px-6 py-3 text-xs font-black transition hover:bg-red-500 disabled:opacity-60"
            >
              {searching ? "LOCALIZANDO..." : "LOCALIZAR"}
            </button>
          </form>

          {searchError && (
            <p className="mt-4 text-sm text-red-400">
              {searchError}
            </p>
          )}

          {hasSearched &&
            !searchError &&
            searchResults.length === 0 && (
              <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-5">
                <p className="font-bold text-zinc-300">
                  Nenhum pedido encontrado.
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Confira o CPF informado e tente novamente.
                </p>
              </div>
            )}

          {searchResults.length > 0 && (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold text-emerald-400">
                  {searchResults.length}{" "}
                  {searchResults.length === 1
                    ? "pedido encontrado"
                    : "pedidos encontrados"}
                </p>

                <p className="text-xs text-zinc-500">
                  Clique no pedido para abrir os detalhes
                </p>
              </div>

              <div className="mt-4 grid gap-3">
                {searchResults.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/pedidos/${order.id}`}
                    className="rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-red-500/40 hover:bg-red-500/5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-black text-red-400">
                          #{order.order_number}
                        </p>

                        <p className="mt-1 text-sm font-bold text-white">
                          {order.customer_name}
                        </p>

                        <p className="mt-2 text-xs text-zinc-500">
                          {date(order.created_at)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-bold text-amber-300">
                          {order.status}
                        </p>

                        <p className="mt-2 text-lg font-black">
                          {money(Number(order.total))}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#101216] p-6">
          <h2 className="text-xl font-black">
            Últimos pedidos
          </h2>

          <div className="mt-5 grid gap-3">
            {data.recentOrders.map((order: any) => (
              <Link
                key={order.id}
                href={`/admin/pedidos/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 text-sm hover:text-red-400"
              >
                <span className="font-bold">
                  #{order.order_number}
                </span>

                <span className="text-zinc-400">
                  {order.customer_name}
                </span>

                <span>
                  {money(Number(order.total))}
                </span>

                <span className="text-zinc-500">
                  {order.status}
                </span>

                <span className="text-xs text-zinc-600">
                  {date(order.created_at)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
