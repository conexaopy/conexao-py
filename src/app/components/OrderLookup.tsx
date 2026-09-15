"use client";

import { useState } from "react";
import { formatPrice } from "../data";
import { formatOrderDateTime } from "../whatsapp";

type PublicOrder = {
  order_number: string;
  created_at: string;
  customer_name: string;
  status: string;
  total: number;
  carrier: string | null;
  tracking_code: string | null;
  tracking_url: string | null;
};

function statusClass(status: string) {
  if (status === "ENTREGUE") return "text-emerald-400";
  if (status === "CANCELADO") return "text-red-400";
  if (
    status === "ENVIADO" ||
    status === "RASTREIO DISPONÍVEL"
  ) return "text-blue-400";
  if (
    status === "PAGAMENTO CONFIRMADO" ||
    status === "PRODUTO CONFIRMADO"
  ) return "text-emerald-300";

  return "text-amber-300";
}

export function OrderLookup() {
  const [orderNumber, setOrderNumber] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState<PublicOrder | null>(null);
  const [history, setHistory] = useState<PublicOrder[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    setHistory([]);

    try {
      const response = await fetch("/api/order-lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          orderNumber,
          identifier,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error ?? "Não foi possível consultar o pedido.",
        );
      }

      setResult(payload.order ?? null);
      setHistory(Array.isArray(payload.history) ? payload.history : []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível consultar o pedido.",
      );
    } finally {
      setSearched(true);
      setLoading(false);
    }
  };

  const copyTracking = async (code: string) => {
    await navigator.clipboard.writeText(code);
  };

  return (
    <>
      <form
        onSubmit={submit}
        className="mt-10 grid gap-4 rounded-2xl border border-white/10 bg-[#101216] p-6 md:grid-cols-[1fr_1fr_auto] md:items-end"
      >
        <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
          Número do pedido
          <input
            required
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            placeholder="CPY-1001"
            className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
          />
        </label>

        <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
          CPF ou WhatsApp
          <input
            required
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="Sua identificação"
            className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
          />
        </label>

        <button
          disabled={loading}
          className="rounded-lg bg-red-600 px-5 py-3 text-xs font-black hover:bg-red-500 disabled:opacity-60"
        >
          {loading ? "CONSULTANDO..." : "CONSULTAR PEDIDO"}
        </button>
      </form>

      {searched && !result && (
        <p className="mt-8 text-sm text-red-400">
          {error ||
            "Não encontramos um pedido com esses dados. Confira o número e o CPF ou WhatsApp."}
        </p>
      )}

      {result && (
        <>
          <section className="mt-10 rounded-2xl border border-emerald-500/20 bg-[#101216] p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Pedido encontrado
            </p>

            <div className="mt-4 flex flex-wrap justify-between gap-5">
              <div>
                <p className="text-2xl font-black text-red-400">
                  #{result.order_number}
                </p>

                <p className="mt-2 text-sm font-bold text-white">
                  {result.customer_name}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  {formatOrderDateTime(result.created_at)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs uppercase tracking-widest text-zinc-500">
                  Status
                </p>

                <p
                  className={`mt-2 font-bold ${statusClass(result.status)}`}
                >
                  {result.status}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-between border-t border-white/10 pt-5 text-sm">
              <span className="text-zinc-500">Total do pedido</span>
              <strong className="text-lg text-white">
                {formatPrice(Number(result.total))}
              </strong>
            </div>

            {(result.carrier ||
              result.tracking_code ||
              result.tracking_url) && (
              <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
                  Informações de envio
                </p>

                {result.carrier && (
                  <p className="mt-4 text-sm text-zinc-400">
                    Transportadora:{" "}
                    <strong className="text-white">
                      {result.carrier}
                    </strong>
                  </p>
                )}

                {result.tracking_code && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                    <span>
                      Código de rastreio:{" "}
                      <strong className="text-white">
                        {result.tracking_code}
                      </strong>
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        void copyTracking(result.tracking_code!)
                      }
                      className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-black text-white hover:bg-white/10"
                    >
                      COPIAR
                    </button>
                  </div>
                )}

                {result.tracking_url && (
                  <a
                    href={result.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-block rounded-lg bg-blue-500 px-5 py-3 text-xs font-black text-white hover:bg-blue-400"
                  >
                    RASTREAR PEDIDO ↗
                  </a>
                )}
              </div>
            )}
          </section>

          <section className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.25em] text-red-400">
                  Minha conta
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  HISTÓRICO DE PEDIDOS
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Pedidos encontrados para {result.customer_name}
                </p>
              </div>

              <p className="text-sm font-bold text-zinc-400">
                {history.length}{" "}
                {history.length === 1 ? "pedido" : "pedidos"}
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              {history.map((item) => (
                <article
                  key={item.order_number}
                  className={`rounded-xl border p-5 ${
                    item.order_number === result.order_number
                      ? "border-red-500/40 bg-red-500/5"
                      : "border-white/10 bg-[#101216]"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-black text-white">
                          #{item.order_number}
                        </p>

                        {item.order_number === result.order_number && (
                          <span className="rounded-full bg-red-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-red-400">
                            Pedido consultado
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-xs text-zinc-500">
                        {formatOrderDateTime(item.created_at)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-xs font-black ${statusClass(
                          item.status,
                        )}`}
                      >
                        {item.status}
                      </p>

                      <p className="mt-2 text-lg font-black text-white">
                        {formatPrice(Number(item.total))}
                      </p>
                    </div>
                  </div>

                  {(item.tracking_code || item.tracking_url) && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
                      {item.tracking_code && (
                        <p className="text-xs text-zinc-500">
                          Rastreio:{" "}
                          <strong className="text-zinc-300">
                            {item.tracking_code}
                          </strong>
                        </p>
                      )}

                      {item.tracking_url && (
                        <a
                          href={item.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-black text-blue-400 hover:text-blue-300"
                        >
                          RASTREAR ↗
                        </a>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
