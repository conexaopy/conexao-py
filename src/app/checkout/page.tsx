import Link from "next/link";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { CheckoutForm } from "../components/CheckoutForm";

export default function CheckoutPage() { return <><Header /><main className="mx-auto min-h-[70vh] w-full max-w-7xl px-5 py-12 lg:px-8 lg:py-16"><Link href="/carrinho" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white">← Voltar ao carrinho</Link><p className="mt-8 text-xs font-bold uppercase tracking-[.3em] text-red-500">Finalização</p><h1 className="mt-3 text-4xl font-black md:text-6xl">Checkout</h1><p className="mt-4 max-w-xl text-zinc-400">Preencha seus dados para gerar o pedido e continuar o atendimento pelo WhatsApp.</p><div className="mt-12"><CheckoutForm /></div></main><Footer /></>; }
