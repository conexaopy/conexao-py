import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Storefront } from "./components/Storefront";
import { getCatalogProducts } from "../lib/supabase/catalog";

export default async function Home() {
  const products = await getCatalogProducts();
  return <><Header /><Storefront products={products} /><a href="https://wa.me/5545991294914" className="fixed bottom-5 right-5 z-30 rounded-full bg-[#25d366] px-4 py-3 text-xs font-black text-black shadow-xl shadow-black/30 transition hover:scale-105">FALAR COM A CONEXÃO PY</a><Footer /></>;
}