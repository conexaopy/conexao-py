"use client";
/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminNav } from "./AdminNav";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  minimum_order: number;
  maximum_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
};

const empty = {
  id: "",
  code: "",
  description: "",
  discount_type: "PERCENTAGE",
  discount_value: 0,
  minimum_order: 0,
  maximum_discount: "",
  usage_limit: "",
  starts_at: "",
  expires_at: "",
  active: true,
};

export function AdminCoupons() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/coupons", { cache: "no-store" });
    const data = await r.json();

    if (r.ok) {
      setItems(data.coupons);
    } else {
      setMessage(data.error);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setMessage("");

    try {
      const editing = Boolean(form.id);

      const r = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await r.json();

      if (!r.ok) {
        setMessage(data.error || "Não foi possível salvar o cupom.");
        return;
      }

      setMessage(
        editing
          ? `Cupom ${form.code} atualizado com sucesso.`
          : `Cupom ${form.code} criado com sucesso.`,
      );

      setForm({ ...empty });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const editCoupon = (item: Coupon) => {
    setMessage("");

    setForm({
      ...item,
      starts_at: item.starts_at?.slice(0, 10) ?? "",
      expires_at: item.expires_at?.slice(0, 10) ?? "",
      maximum_discount: item.maximum_discount ?? "",
      usage_limit: item.usage_limit ?? "",
    });

    window.setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const cancelEdit = () => {
    setForm({ ...empty });
    setMessage("");
  };

  const deleteCoupon = async (item: Coupon) => {
    if (item.used_count > 0) {
      window.alert(
        `O cupom ${item.code} já possui ${item.used_count} uso(s). Para preservar o histórico dos pedidos, desative o cupom em vez de excluí-lo.`,
      );
      return;
    }

    const confirmed = window.confirm(
      `Excluir definitivamente o cupom ${item.code}?\n\nEsta ação não poderá ser desfeita.`,
    );

    if (!confirmed) return;

    setMessage("");

    const r = await fetch(
      `/api/admin/coupons?id=${encodeURIComponent(item.id)}`,
      { method: "DELETE" },
    );

    const data = await r.json();

    if (!r.ok) {
      setMessage(data.error || "Não foi possível excluir o cupom.");
      return;
    }

    if (form.id === item.id) {
      setForm({ ...empty });
    }

    setMessage(`Cupom ${item.code} excluído com sucesso.`);
    await load();
  };

  const formatDiscount = (item: Coupon) => {
    if (item.discount_type === "FIXED") {
      return `R$ ${Number(item.discount_value).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    return `${Number(item.discount_value).toLocaleString("pt-BR", {
      maximumFractionDigits: 2,
    })}%`;
  };

  const formatDate = (value: string | null) => {
    if (!value) return "Sem limite";

    const date = new Date(`${value.slice(0, 10)}T12:00:00`);

    return date.toLocaleDateString("pt-BR");
  };

  return (
    <main className="min-h-screen bg-[#090a0c] px-5 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-black">Cupons</h1>

        <AdminNav />

        <form
          ref={formRef}
          onSubmit={save}
          className="scroll-mt-6 rounded-2xl border border-white/10 bg-[#101216] p-6"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.25em] text-red-500">
                {form.id ? "Modo de edição" : "Novo cupom"}
              </p>

              <h2 className="mt-2 text-xl font-black">
                {form.id
                  ? `Editando cupom: ${form.code}`
                  : "Criar novo cupom"}
              </h2>

              {form.id && (
                <p className="mt-1 text-xs text-zinc-500">
                  Altere os campos desejados e clique em Atualizar cupom.
                </p>
              )}
            </div>

            {form.id && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-white/15 px-4 py-2.5 text-xs font-black text-zinc-300 hover:bg-white/5 hover:text-white"
              >
                CANCELAR EDIÇÃO
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-400">
                Código do cupom
              </label>
              <input
                required
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="Ex.: CONEXAOPY"
                className="admin-input"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-400">
                Tipo de desconto
              </label>
              <select
                value={form.discount_type}
                onChange={(e) =>
                  setForm({ ...form, discount_type: e.target.value })
                }
                className="admin-input"
              >
                <option value="PERCENTAGE">Percentual</option>
                <option value="FIXED">Valor fixo</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-400">
                {form.discount_type === "FIXED"
                  ? "Valor do desconto (R$)"
                  : "Percentual de desconto (%)"}
              </label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.discount_value}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discount_value: Number(e.target.value),
                  })
                }
                placeholder="Valor"
                className="admin-input"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-400">
                Pedido mínimo (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.minimum_order}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minimum_order: Number(e.target.value),
                  })
                }
                placeholder="0"
                className="admin-input"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-400">
                Desconto máximo (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.maximum_discount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maximum_discount: e.target.value,
                  })
                }
                placeholder="Sem limite"
                className="admin-input"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-400">
                Limite de usos
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.usage_limit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    usage_limit: e.target.value,
                  })
                }
                placeholder="Ilimitado"
                className="admin-input"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-400">
                Início da validade
              </label>
              <input
                type="date"
                value={form.starts_at}
                onChange={(e) =>
                  setForm({ ...form, starts_at: e.target.value })
                }
                className="admin-input"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-400">
                Fim da validade
              </label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) =>
                  setForm({ ...form, expires_at: e.target.value })
                }
                className="admin-input"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-bold">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm({ ...form, active: e.target.checked })
                }
              />
              Cupom ativo
            </label>

            <button
              disabled={saving}
              className="min-w-48 rounded-lg bg-red-600 px-6 py-3 text-xs font-black hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "SALVANDO..."
                : form.id
                  ? "ATUALIZAR CUPOM"
                  : "CRIAR CUPOM"}
            </button>
          </div>
        </form>

        {message && (
          <p className="mt-4 rounded-lg border border-white/10 bg-white/[.03] px-4 py-3 text-sm text-zinc-300">
            {message}
          </p>
        )}

        <div className="mt-8 grid gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-white/10 bg-[#101216] p-5"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-black">{item.code}</p>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${
                      item.active
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        : "border-red-500/20 bg-red-500/10 text-red-400"
                    }`}
                  >
                    {item.active ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500">
                  <span>
                    Desconto:{" "}
                    <strong className="text-zinc-300">
                      {formatDiscount(item)}
                    </strong>
                  </span>

                  <span>
                    Usos:{" "}
                    <strong className="text-zinc-300">
                      {item.used_count}
                      {item.usage_limit == null
                        ? " / Ilimitado"
                        : ` / ${item.usage_limit}`}
                    </strong>
                  </span>

                  <span>
                    Validade:{" "}
                    <strong className="text-zinc-300">
                      {formatDate(item.starts_at)} até{" "}
                      {formatDate(item.expires_at)}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => editCoupon(item)}
                  className="rounded-lg border border-white/15 px-4 py-2.5 text-xs font-black hover:border-red-500/50 hover:bg-red-500/10"
                >
                  EDITAR
                </button>

                <button
                  type="button"
                  onClick={() => void deleteCoupon(item)}
                  className="rounded-lg border border-red-500/30 px-4 py-2.5 text-xs font-black text-red-400 hover:border-red-500 hover:bg-red-500/10"
                >
                  EXCLUIR
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-zinc-500">
              Nenhum cupom cadastrado.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
