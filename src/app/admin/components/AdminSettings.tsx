"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { AdminNav } from "./AdminNav";

type StoreSettings = {
  name: string;
  locale: string;
  currency: string;
  shipping_fee: number;
  free_shipping_from: number;
  notice_enabled: boolean;
  notice_text: string;
};

export function AdminSettings() {
  const [store, setStore] = useState<StoreSettings>({
    name: "CONEXÃO PY",
    locale: "pt-BR",
    currency: "BRL",
    shipping_fee: 34.99,
    free_shipping_from: 1000,
    notice_enabled: true,
    notice_text: "",
  });

  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappGroup, setWhatsappGroup] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const r = await fetch("/api/admin/settings", {
      cache: "no-store",
    });

    const data = await r.json();

    if (!r.ok) {
      setMessage(data.error ?? "Não foi possível carregar as configurações.");
      setLoading(false);
      return;
    }

    for (const item of data.settings ?? []) {
      if (item.key === "store" && item.value) {
        setStore((current) => ({
          ...current,
          ...item.value,
        }));
      }

      if (item.key === "whatsapp") {
        setWhatsapp(item.value?.number ?? "");
      }

      if (item.key === "whatsapp_group") {
        setWhatsappGroup(item.value?.url ?? "");
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSetting = async (key: string, value: unknown) => {
    setMessage("Salvando...");

    const r = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        value,
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      setMessage(data.error ?? "Não foi possível salvar.");
      return false;
    }

    setMessage("Configurações salvas com sucesso.");
    return true;
  };

  const saveStore = async () => {
    await saveSetting("store", store);
  };

  const saveWhatsapp = async () => {
    await saveSetting("whatsapp", {
      number: whatsapp.replace(/\D/g, ""),
    });
  };

  const saveGroup = async () => {
    await saveSetting("whatsapp_group", {
      url: whatsappGroup.trim(),
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#090a0c] px-5 py-8 text-zinc-400 lg:px-8">
        Carregando configurações...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090a0c] px-5 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.3em] text-red-500">
            Administração
          </p>

          <h1 className="mt-3 text-4xl font-black">Configurações</h1>

          <p className="mt-2 text-sm text-zinc-500">
            Gerencie dados gerais da CONEXÃO PY sem precisar alterar o código.
          </p>
        </div>

        <AdminNav />

        {message && (
          <div className="mb-6 rounded-xl border border-white/10 bg-[#101216] px-4 py-3 text-sm text-zinc-300">
            {message}
          </div>
        )}

        <div className="grid gap-6">
          <section className="rounded-2xl border border-white/10 bg-[#101216] p-6">
            <div className="border-b border-white/10 pb-5">
              <p className="text-xs font-bold uppercase tracking-[.25em] text-red-500">
                Loja
              </p>
              <h2 className="mt-2 text-xl font-black">Dados gerais</h2>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Nome da loja
                <input
                  value={store.name}
                  onChange={(e) =>
                    setStore((current) => ({
                      ...current,
                      name: e.target.value,
                    }))
                  }
                  className="admin-input"
                />
              </label>

              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Aviso da loja
                <input
                  value={store.notice_text}
                  onChange={(e) =>
                    setStore((current) => ({
                      ...current,
                      notice_text: e.target.value,
                    }))
                  }
                  placeholder="Ex.: Envios para todo o Brasil."
                  className="admin-input"
                />
              </label>
            </div>

            <label className="mt-5 flex items-center gap-3 text-sm font-bold text-zinc-300">
              <input
                type="checkbox"
                checked={store.notice_enabled}
                onChange={(e) =>
                  setStore((current) => ({
                    ...current,
                    notice_enabled: e.target.checked,
                  }))
                }
              />
              Exibir aviso da loja
            </label>

            <button
              type="button"
              onClick={() => void saveStore()}
              className="mt-6 rounded-lg bg-red-600 px-5 py-3 text-xs font-black hover:bg-red-500"
            >
              SALVAR DADOS DA LOJA
            </button>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#101216] p-6">
            <div className="border-b border-white/10 pb-5">
              <p className="text-xs font-bold uppercase tracking-[.25em] text-red-500">
                Frete
              </p>
              <h2 className="mt-2 text-xl font-black">
                Valores de entrega
              </h2>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Frete padrão
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={store.shipping_fee}
                  onChange={(e) =>
                    setStore((current) => ({
                      ...current,
                      shipping_fee: Number(e.target.value),
                    }))
                  }
                  className="admin-input"
                />
                <span className="mt-2 block text-xs normal-case tracking-normal text-zinc-600">
                  Valor atual: R$ {store.shipping_fee.toFixed(2)}
                </span>
              </label>

              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Frete grátis a partir de
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={store.free_shipping_from}
                  onChange={(e) =>
                    setStore((current) => ({
                      ...current,
                      free_shipping_from: Number(e.target.value),
                    }))
                  }
                  className="admin-input"
                />
                <span className="mt-2 block text-xs normal-case tracking-normal text-zinc-600">
                  Pedido mínimo para frete grátis.
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => void saveStore()}
              className="mt-6 rounded-lg bg-red-600 px-5 py-3 text-xs font-black hover:bg-red-500"
            >
              SALVAR FRETE
            </button>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#101216] p-6">
            <div className="border-b border-white/10 pb-5">
              <p className="text-xs font-bold uppercase tracking-[.25em] text-red-500">
                Atendimento
              </p>
              <h2 className="mt-2 text-xl font-black">
                WhatsApp
              </h2>
            </div>

            <div className="mt-5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Número oficial
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="5545999999999"
                  className="admin-input"
                />
              </label>

              <button
                type="button"
                onClick={() => void saveWhatsapp()}
                className="mt-4 rounded-lg bg-red-600 px-5 py-3 text-xs font-black hover:bg-red-500"
              >
                SALVAR WHATSAPP
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#101216] p-6">
            <div className="border-b border-white/10 pb-5">
              <p className="text-xs font-bold uppercase tracking-[.25em] text-blue-400">
                Comunidade
              </p>
              <h2 className="mt-2 text-xl font-black">
                Grupo da CONEXÃO PY
              </h2>
            </div>

            <label className="mt-5 block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Link do grupo
              <input
                value={whatsappGroup}
                onChange={(e) => setWhatsappGroup(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="admin-input"
              />
            </label>

            <button
              type="button"
              onClick={() => void saveGroup()}
              className="mt-4 rounded-lg bg-blue-600 px-5 py-3 text-xs font-black hover:bg-blue-500"
            >
              SALVAR GRUPO
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
