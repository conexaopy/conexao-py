"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { AdminNav } from "./AdminNav";

type SettingValue =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

type Setting = {
  key: string;
  value: SettingValue;
  description: string | null;
};

type EditableSetting = {
  key: string;
  value: string;
  description: string | null;
};

function formatValue(value: SettingValue): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function parseValue(value: string): SettingValue {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

export function AdminSettings() {
  const [items, setItems] = useState<EditableSetting[]>([]);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/settings", {
      cache: "no-store",
    });

    const data = await r.json();

    if (r.ok) {
      const settings = (data.settings ?? []) as Setting[];

      setItems(
        settings.map((item) => ({
          key: item.key,
          value: formatValue(item.value),
          description: item.description,
        })),
      );
    } else {
      setMessage(data.error ?? "Não foi possível carregar as configurações.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (item: EditableSetting) => {
    setMessage("");

    const r = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: item.key,
        value: parseValue(item.value),
      }),
    });

    const data = await r.json();

    setMessage(
      r.ok
        ? "Configuração salva."
        : data.error ?? "Não foi possível salvar a configuração.",
    );

    if (r.ok) {
      await load();
    }
  };

  return (
    <main className="min-h-screen bg-[#090a0c] px-5 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-black">Configurações</h1>

        <AdminNav />

        {message && (
          <p className="mb-4 text-sm text-emerald-400">{message}</p>
        )}

        <div className="grid gap-4">
          {items.map((item, index) => (
            <div
              key={item.key}
              className="rounded-2xl border border-white/10 bg-[#101216] p-6"
            >
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {item.key}

                <textarea
                  value={item.value}
                  onChange={(e) =>
                    setItems((current) =>
                      current.map((entry, currentIndex) =>
                        currentIndex === index
                          ? { ...entry, value: e.target.value }
                          : entry,
                      ),
                    )
                  }
                  className="admin-input min-h-20 font-mono"
                />

                <span className="mt-2 block text-xs normal-case tracking-normal text-zinc-600">
                  {item.description}
                </span>
              </label>

              <button
                type="button"
                onClick={() => void save(item)}
                className="mt-4 rounded-lg bg-red-600 px-4 py-3 text-xs font-black"
              >
                SALVAR
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}