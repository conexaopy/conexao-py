"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "../CartProvider";
import { formatPrice } from "../data";
import { saveOrder } from "../orderStore";
import type { Address, Customer } from "../orderTypes";
import { formatCEP, formatCPF, formatPhone, normalizeDigits, validateCPF, validateFullName, validatePhone } from "../checkoutUtils";

const initialCustomer: Customer = { name: "", cpf: "", whatsapp: "", email: "" };
const initialAddress: Address = { cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" };
const fieldClass = "mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500";

type FieldKey = keyof Customer | keyof Address | "cart";
type ViaCepResponse = { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };

export function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [customer, setCustomer] = useState(initialCustomer);
  const [address, setAddress] = useState(initialAddress);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [shippingFee, setShippingFee] = useState(34.99);
  const [freeShippingFrom, setFreeShippingFrom] = useState(1000);
  const cepRequest = useRef("");
  const orderRequestId = useRef<string | null>(null);

  useEffect(() => {
    void fetch("/api/store-settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (typeof data.shippingFee === "number") {
          setShippingFee(data.shippingFee);
        }

        if (typeof data.freeShippingFrom === "number") {
          setFreeShippingFrom(data.freeShippingFrom);
        }
      })
      .catch(() => {});
  }, []);

  const discount = subtotal > 700 ? subtotal * .1 : 0;
  const shipping =
    subtotal === 0 || subtotal >= freeShippingFrom ? 0 : shippingFee;
  const total = subtotal - discount + shipping;

  const setError = (key: FieldKey, message?: string) => setErrors((current) => {
    const next = { ...current };
    if (message) next[key] = message;
    else delete next[key];
    return next;
  });

  const validateField = (key: FieldKey, nextCustomer = customer, nextAddress = address) => {
    let message: string | undefined;
    if (key === "name" && !validateFullName(nextCustomer.name)) message = nextCustomer.name.trim() ? "Informe nome e sobrenome." : "Informe seu nome completo.";
    if (key === "cpf") message = normalizeDigits(nextCustomer.cpf).length !== 11 ? "Informe os 11 dígitos do CPF." : !validateCPF(nextCustomer.cpf) ? "CPF inválido." : undefined;
    if (key === "whatsapp" && !validatePhone(nextCustomer.whatsapp)) message = "Informe um WhatsApp válido com DDD.";
    if (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextCustomer.email.trim())) message = "Informe um e-mail válido.";
    if (key === "cep" && normalizeDigits(nextAddress.cep).length !== 8) message = "Informe um CEP completo.";
    if (["street", "number", "neighborhood", "city", "state"].includes(key) && !nextAddress[key as keyof Address].trim()) message = "Campo obrigatório.";
    setError(key, message);
    return message;
  };

  const markTouched = (key: FieldKey) => {
    setTouched((current) => ({ ...current, [key]: true }));
    validateField(key);
  };

  const updateCustomer = (key: keyof Customer, value: string) => {
    const nextValue = key === "cpf" ? formatCPF(value) : key === "whatsapp" ? formatPhone(value) : value;
    const nextCustomer = { ...customer, [key]: nextValue };
    setCustomer(nextCustomer);
    if (touched[key] || submitted) validateField(key, nextCustomer, address);
  };

  const updateAddress = (key: keyof Address, value: string) => {
    const nextValue = key === "cep" ? formatCEP(value) : key === "state" ? value.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase() : value;
    const nextAddress = { ...address, [key]: nextValue };
    setAddress(nextAddress);
    if (touched[key] || submitted) validateField(key, customer, nextAddress);
    if (key === "cep") {
      const digits = normalizeDigits(nextValue);
      if (digits.length < 8) {
        cepRequest.current = "";
        setCepLoading(false);
        setError("cep");
      } else if (digits.length === 8 && digits !== cepRequest.current) {
        cepRequest.current = digits;
        void lookupCep(digits);
      }
    }
  };

  const lookupCep = async (cep: string) => {
    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) throw new Error("network");
      const data = await response.json() as ViaCepResponse;
      if (data.erro) {
        setError("cep", "CEP não encontrado.");
        return;
      }
      const filledAddress = { street: data.logradouro ?? "", neighborhood: data.bairro ?? "", city: data.localidade ?? "", state: data.uf ?? "" };
      setAddress((current) => ({ ...current, ...filledAddress }));
      setError("cep");
      (Object.keys(filledAddress) as (keyof typeof filledAddress)[]).forEach((key) => setError(key, filledAddress[key].trim() ? undefined : "Campo obrigatório."));
    } catch {
      setError("cep", "Não foi possível consultar o CEP. Preencha o endereço manualmente.");
    } finally {
      setCepLoading(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (processing) return;
    setSubmitted(true);
    const nextErrors: Partial<Record<FieldKey, string>> = {};
    (Object.keys(initialCustomer) as (keyof Customer)[]).forEach((key) => { const message = validateField(key); if (message) nextErrors[key] = message; });
    (Object.keys(initialAddress) as (keyof Address)[]).forEach((key) => { if (key !== "complement") { const message = validateField(key); if (message) nextErrors[key] = message; } });
    if (!items.length) nextErrors.cart = "Adicione pelo menos um produto ao carrinho.";
    if (Object.keys(nextErrors).length) {
      setErrors((current) => ({ ...current, ...nextErrors }));
      setTouched({ name: true, cpf: true, whatsapp: true, email: true, cep: true, street: true, number: true, neighborhood: true, city: true, state: true });
      return;
    }
    setProcessing(true);
    try {
      if (!orderRequestId.current) {
        orderRequestId.current = crypto.randomUUID();
      }

      const requestId = orderRequestId.current;

      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId, customer: { ...customer, cpf: normalizeDigits(customer.cpf), whatsapp: normalizeDigits(customer.whatsapp) }, address: { ...address, cep: normalizeDigits(address.cep), state: address.state.toUpperCase() }, items: items.map(({ id, quantity }) => ({ id, quantity })) }) });
      const result = await response.json() as { ok: boolean; order?: import("../orderTypes").Order; error?: string };
      if (!response.ok || !result.ok || !result.order) throw new Error(result.error ?? "Não foi possível criar o pedido.");
      saveOrder(result.order);
      clearCart();
      router.push(`/pedido/${result.order.orderNumber}?id=${encodeURIComponent(requestId)}`);
    } catch (error) {
      setError("cart", error instanceof Error ? error.message : "Não foi possível criar o pedido.");
      setProcessing(false);
    }
  };

  const errorFor = (key: FieldKey) => (touched[key] || submitted) && errors[key] ? <span className="mt-1 block text-xs font-normal normal-case tracking-normal text-red-400">{errors[key]}</span> : null;
  const input = (label: string, key: keyof Customer, placeholder: string, inputMode?: "numeric" | "email") => <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">{label}<input type={key === "email" ? "email" : "text"} value={customer[key]} onBlur={() => markTouched(key)} onChange={(event) => updateCustomer(key, event.target.value)} placeholder={placeholder} inputMode={inputMode} maxLength={key === "cpf" ? 14 : key === "whatsapp" ? 15 : undefined} className={fieldClass} />{errorFor(key)}</label>;
  const addressInput = (label: string, key: keyof Address, placeholder: string, optional = false) => <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">{label}{optional && <span className="ml-1 font-normal normal-case text-zinc-600">(opcional)</span>}<input type="text" value={address[key]} onBlur={() => markTouched(key)} onChange={(event) => updateAddress(key, event.target.value)} placeholder={placeholder} inputMode={key === "cep" ? "numeric" : undefined} maxLength={key === "cep" ? 9 : key === "state" ? 2 : undefined} className={fieldClass} />{key === "cep" && cepLoading && <span className="mt-1 block text-xs font-normal normal-case tracking-normal text-zinc-500">Consultando CEP...</span>}{errorFor(key)}</label>;

  if (!items.length && !processing) return <EmptyCheckout />;
  return <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_360px]"><div className="grid gap-8"><section className="border-t border-white/10 pt-6"><h2 className="text-xl font-black">Dados do cliente</h2><div className="mt-5 grid gap-5 md:grid-cols-2">{input("Nome completo", "name", "Seu nome")}{input("CPF", "cpf", "000.000.000-00", "numeric")}{input("WhatsApp", "whatsapp", "(00) 00000-0000", "numeric")}{input("E-mail", "email", "voce@email.com", "email")}</div></section><section className="border-t border-white/10 pt-6"><h2 className="text-xl font-black">Endereço de entrega</h2><div className="mt-5 grid gap-5 md:grid-cols-2">{addressInput("CEP", "cep", "00000-000")}{addressInput("Rua", "street", "Nome da rua")}{addressInput("Número", "number", "123")}{addressInput("Complemento", "complement", "Apto, bloco...", true)}{addressInput("Bairro", "neighborhood", "Seu bairro")}{addressInput("Cidade", "city", "Sua cidade")}{addressInput("Estado", "state", "PR")}</div></section></div><aside className="h-fit rounded-2xl border border-white/10 bg-[#101216] p-6 lg:sticky lg:top-24"><h2 className="text-lg font-black">Resumo do pedido</h2><div className="mt-5 grid gap-4 border-b border-white/10 pb-5">{items.map((item) => <div key={item.id} className="flex justify-between gap-3 text-sm"><span className="text-zinc-400">{item.quantity}x {item.name}<small className="block text-xs text-zinc-600">{formatPrice(item.price)} un.</small></span><span className="font-bold">{formatPrice(item.price * item.quantity)}</span></div>)}</div><div className="mt-5 grid gap-3 text-sm text-zinc-400"><div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="flex justify-between"><span>Desconto</span><span className="text-emerald-400">-{formatPrice(discount)}</span></div><div className="flex justify-between"><span>Envio</span><span>{shipping ? formatPrice(shipping) : "Grátis"}</span></div></div><div className="mt-5 flex justify-between border-t border-white/10 pt-5 text-lg font-black"><span>Total</span><span>{formatPrice(total)}</span></div><div className="mt-5 flex gap-2"><input placeholder="Cupom demonstrativo" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-xs outline-none" /><button type="button" className="rounded-lg border border-white/15 px-3 text-[10px] font-bold">APLICAR</button></div>{errorFor("cart")}<button disabled={processing} className="mt-5 w-full rounded-lg bg-red-600 px-5 py-4 text-xs font-black tracking-wider transition hover:bg-red-500 disabled:cursor-wait disabled:opacity-60">{processing ? "GERANDO PEDIDO..." : "FINALIZAR PEDIDO"}</button></aside></form>;
}

function EmptyCheckout() { return <div className="border border-dashed border-white/15 py-20 text-center"><p className="font-bold">Seu carrinho está vazio.</p><Link href="/#catalogo" className="mt-5 inline-block rounded-lg bg-red-600 px-5 py-3 text-xs font-black">VOLTAR PARA A LOJA</Link></div>; }
