import { Suspense } from "react";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Storefront } from "./components/Storefront";
import { getCatalogProducts } from "../lib/supabase/catalog";
import { getStoreSettings } from "../lib/supabase/storeSettings";

export default async function Home() {
  const [products, settings] = await Promise.all([
    getCatalogProducts(),
    getStoreSettings(),
  ]);

  return (
    <>
      <Header />

      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <Storefront products={products} />
      </Suspense>

      <a
        href={settings.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-30 rounded-full bg-[#25d366] px-4 py-3 text-xs font-black text-black shadow-xl shadow-black/30 transition hover:scale-105"
      >
        FALAR COM A CONEXÃO PY
      </a>

      <Footer />
    </>
  );
}
