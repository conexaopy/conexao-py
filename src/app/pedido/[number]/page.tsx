"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { OrderSuccess } from "../../components/OrderSuccess";
import { getOrders } from "../../orderStore";
import type { Order } from "../../orderTypes";

export default function OrderPage() { const { number } = useParams<{ number: string }>(); const [order, setOrder] = useState<Order | null>(null); useEffect(() => { const frame = window.requestAnimationFrame(() => setOrder(getOrders().find((item) => item.orderNumber === number) ?? null)); return () => window.cancelAnimationFrame(frame); }, [number]); if (!order) return <><Header /><main className="mx-auto min-h-[70vh] max-w-5xl px-5 py-20 text-center"><p className="text-zinc-400">Carregando pedido...</p></main><Footer /></>; return <><Header /><OrderSuccess order={order} /><Footer /></>; }
