"use client";

import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { OrderLookup } from "../components/OrderLookup";

export default function TrackOrder() { return <><Header /><main className="mx-auto min-h-[70vh] w-full max-w-5xl px-5 py-16 lg:px-8"><p className="text-xs font-bold uppercase tracking-[.3em] text-red-500">Pedidos</p><h1 className="mt-4 text-4xl font-black md:text-6xl">Acompanhe seu pedido</h1><p className="mt-4 max-w-xl text-zinc-400">Consulte o status da sua entrega com os dados do pedido.</p><OrderLookup /></main><Footer /></>; }
