import { notFound } from "next/navigation";
import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { ProductDetail } from "../../components/ProductDetail";
import { getCatalogProduct, getCatalogProducts } from "../../../lib/supabase/catalog";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const product = await getCatalogProduct(slug); if (!product) notFound(); const related = (await getCatalogProducts()).filter((item) => item.id !== product.id && item.category === product.category).slice(0, 3); return <><Header /><ProductDetail product={product} related={related} /><Footer /></>; }
