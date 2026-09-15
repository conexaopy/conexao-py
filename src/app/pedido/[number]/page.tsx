"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { OrderSuccess } from "../../components/OrderSuccess";
import type { Order } from "../../orderTypes";

export default function OrderPage() {
  const { number } = useParams<{ number: string }>();
  const searchParams = useSearchParams();
  const confirmationToken = searchParams.get("token");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!confirmationToken) return;

    void fetch("/api/order-confirmation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({ confirmationToken, orderNumber: number }),
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok || !data.order) {
          throw new Error(
            data.error ?? "Não foi possível carregar o pedido.",
          );
        }

        if (data.order.orderNumber !== number) {
          throw new Error("Os dados deste pedido não conferem.");
        }

        setOrder(data.order as Order);
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível carregar o pedido.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [number, confirmationToken]);

  if (!confirmationToken) {
    return (
      <>
        <Header />
        <main className="mx-auto min-h-[70vh] max-w-5xl px-5 py-20 text-center">
          <h1 className="text-2xl font-black">PEDIDO NÃO ENCONTRADO</h1>
          <p className="mt-3 text-zinc-400">
            Não foi possível identificar este pedido.
          </p>
        </main>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="mx-auto min-h-[70vh] max-w-5xl px-5 py-20 text-center">
          <p className="text-zinc-400">Carregando pedido...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header />
        <main className="mx-auto min-h-[70vh] max-w-5xl px-5 py-20 text-center">
          <h1 className="text-2xl font-black">PEDIDO NÃO ENCONTRADO</h1>
          <p className="mt-3 text-zinc-400">{error}</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <OrderSuccess order={order} />
      <Footer />
    </>
  );
}
