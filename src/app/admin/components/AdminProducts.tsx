"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { AdminNav } from "./AdminNav";

const statuses = [
  "PRONTA ENTREGA",
  "SOB ENCOMENDA",
  "OFERTA",
  "NOVIDADE",
  "MAIS VENDIDO",
];

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Product = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  category_id: string;
  presentation: string | null;
  description: string | null;
  price: number;
  promo_price: number | null;
  stock_quantity: number;
  status: string;
  image_url: string | null;
  active: boolean;
  featured: boolean;
  bestseller: boolean;
  is_new: boolean;
  updated_at: string;
  category?: { name: string } | { name: string }[] | null;
};

type Form = Omit<Product, "id" | "updated_at" | "category">;

const emptyForm: Form = {
  slug: "",
  sku: "",
  name: "",
  category_id: "",
  presentation: "",
  description: "",
  price: 0,
  promo_price: null,
  stock_quantity: 0,
  status: "PRONTA ENTREGA",
  image_url: null,
  active: true,
  featured: false,
  bestseller: false,
  is_new: false,
};

const money = (value: number | null) =>
  value == null
    ? "-"
    : value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const imageLoader = ({ src }: { src: string }) => src;

export function AdminProducts() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState<Form>(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    active: "",
    status: "",
    featured: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams({ ...filters });

    if (search) {
      params.set("search", search);
    }

    const response = await fetch(`/api/admin/products?${params}`, {
      cache: "no-store",
    });

    const result = await response.json();

    if (response.ok) {
      setProducts(result.products);
      setCategories(result.categories);
      setError("");
    } else {
      setError(result.error ?? "Não foi possível carregar produtos.");
    }

    setLoading(false);
  }, [filters, search]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void load();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const setField = (
    key: keyof Form,
    value: string | number | boolean | null,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const clearSelectedImage = () => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const startNew = () => {
    clearSelectedImage();

    setEditing(null);

    setForm({
      ...emptyForm,
      category_id: categories[0]?.id ?? "",
    });

    setError("");
    setNotice("");
  };

  const edit = (product: Product) => {
    clearSelectedImage();

    setEditing(product.id);

    setForm({
      slug: product.slug,
      sku: product.sku,
      name: product.name,
      category_id: product.category_id,
      presentation: product.presentation ?? "",
      description: product.description ?? "",
      price: product.price,
      promo_price: product.promo_price,
      stock_quantity: product.stock_quantity,
      status: product.status,
      image_url: product.image_url,
      active: product.active,
      featured: product.featured,
      bestseller: product.bestseller,
      is_new: product.is_new,
    });

    setPreviewUrl(product.image_url);
    setError("");
    setNotice("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

const removeImage = () => {
  if (previewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl);
  }

  setSelectedFile(null);
  setPreviewUrl(null);
  setField("image_url", null);
  setError("");
  setNotice("Imagem removida. Clique em SALVAR PRODUTO para confirmar.");
};
  const chooseImage = (file: File | null) => {
    setError("");
    setNotice("");

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Use uma imagem JPG, JPEG, PNG ou WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5 MB.");
      return;
    }

    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadSelectedImage = async () => {
    if (!selectedFile) {
      return form.image_url;
    }

    setUploading(true);

    try {
      const body = new FormData();
      body.append("file", selectedFile);

      const response = await fetch(
        "/api/admin/upload-product-image",
        {
          method: "POST",
          body,
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Não foi possível enviar a imagem.",
        );
      }

      return result.url as string;
    } finally {
      setUploading(false);
    }
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setNotice("");

    try {
      let imageUrl = form.image_url;

      if (selectedFile) {
        imageUrl = await uploadSelectedImage();
      }

      const productPayload = {
        ...form,
        image_url: imageUrl,
      };

      const response = await fetch(
        editing
          ? `/api/admin/products/${editing}`
          : "/api/admin/products",
        {
          method: editing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productPayload),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Não foi possível salvar o produto.",
        );
      }

      setNotice(
        editing
          ? "Produto atualizado no Supabase."
          : "Produto criado no Supabase.",
      );

      clearSelectedImage();

      setEditing(null);

      setForm({
        ...emptyForm,
        category_id: categories[0]?.id ?? "",
      });

      await load();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível salvar o produto.",
      );
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const quickUpdate = async (
    product: Product,
    patch: Partial<Form>,
  ) => {
    const response = await fetch(
      `/api/admin/products/${product.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...product,
          ...patch,
        }),
      },
    );

    if (response.ok) {
      await load();
      return;
    }

    const result = await response.json();

    setError(
      result.error ?? "Não foi possível atualizar o produto.",
    );
  };

  const logout = async () => {
    await fetch("/api/admin/logout", {
      method: "POST",
    });

    router.push("/admin/login");
    router.refresh();
  };

  const categoryName = (category: Product["category"]) =>
    Array.isArray(category)
      ? category[0]?.name ?? "-"
      : category?.name ?? "-";

  return (
    <main className="min-h-screen bg-[#090a0c] px-5 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.3em] text-red-500">
              Operação
            </p>

            <h1 className="mt-3 text-4xl font-black">
              Produtos
            </h1>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-lg border border-white/15 px-4 py-3 text-xs font-bold"
            >
              Ver loja
            </Link>

            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg border border-white/15 px-4 py-3 text-xs font-bold text-zinc-400"
            >
              Sair
            </button>
          </div>
        </header>

        <AdminNav />

        <form
          onSubmit={save}
          className="rounded-2xl border border-white/10 bg-[#101216] p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-black">
              {editing ? "Editar produto" : "Novo produto"}
            </h2>

            <button
              type="button"
              onClick={startNew}
              className="rounded-lg border border-white/15 px-4 py-3 text-xs font-bold"
            >
              NOVO PRODUTO
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <label className="text-xs font-bold uppercase text-zinc-400">
              Nome
              <input
                required
                value={form.name}
                onChange={(event) => {
                  const value = event.target.value;

                  setField("name", value);

                  if (!editing && !form.slug) {
                    setField("slug", slugify(value));
                  }
                }}
                className="admin-input"
              />
            </label>

            <label className="text-xs font-bold uppercase text-zinc-400">
              Slug
              <input
                required
                value={form.slug}
                onChange={(event) =>
                  setField("slug", slugify(event.target.value))
                }
                className="admin-input"
              />
            </label>

            <label className="text-xs font-bold uppercase text-zinc-400">
              SKU
              <input
                value={form.sku}
                onChange={(event) =>
                  setField("sku", event.target.value)
                }
                className="admin-input"
              />
            </label>

            <label className="text-xs font-bold uppercase text-zinc-400">
              Categoria
              <select
                required
                value={form.category_id}
                onChange={(event) =>
                  setField("category_id", event.target.value)
                }
                className="admin-input"
              >
                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-bold uppercase text-zinc-400">
              Apresentação
              <input
                value={form.presentation ?? ""}
                onChange={(event) =>
                  setField("presentation", event.target.value)
                }
                className="admin-input"
              />
            </label>

            <label className="text-xs font-bold uppercase text-zinc-400">
              Status
              <select
                value={form.status}
                onChange={(event) =>
                  setField("status", event.target.value)
                }
                className="admin-input"
              >
                {statuses.map((status) => (
                  <option key={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-bold uppercase text-zinc-400">
              Preço
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(event) =>
                  setField(
                    "price",
                    Number(event.target.value),
                  )
                }
                className="admin-input"
              />
            </label>

            <label className="text-xs font-bold uppercase text-zinc-400">
              Preço promocional
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.promo_price ?? ""}
                onChange={(event) =>
                  setField(
                    "promo_price",
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
                className="admin-input"
              />
            </label>

            <label className="text-xs font-bold uppercase text-zinc-400">
              Estoque
              <input
                required
                type="number"
                min="0"
                step="1"
                value={form.stock_quantity}
                onChange={(event) =>
                  setField(
                    "stock_quantity",
                    Number(event.target.value),
                  )
                }
                className="admin-input"
              />
            </label>

            <div className="md:col-span-3">
              <p className="text-xs font-bold uppercase text-zinc-400">
                Imagem do produto
              </p>

              <div className="mt-2 flex flex-col gap-4 rounded-xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center">
                <div className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/5">
                  {previewUrl || form.image_url ? (
                    <Image
                      loader={imageLoader}
                      unoptimized
                      src={previewUrl ?? form.image_url!}
                      alt="Prévia do produto"
                      width={128}
                      height={128}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-zinc-600">
                      SEM IMAGEM
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      chooseImage(
                        event.target.files?.[0] ?? null,
                      )
                    }
                    className="block w-full text-sm text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-red-600 file:px-4 file:py-3 file:text-xs file:font-black file:text-white hover:file:bg-red-500"
                  />
                  {(previewUrl || form.image_url) && (
  <button
    type="button"
    onClick={removeImage}
    className="mt-3 rounded-lg border border-red-500/40 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10"
  >
    REMOVER IMAGEM
  </button>
)}

                  <p className="mt-2 text-xs text-zinc-600">
                    JPG, JPEG, PNG ou WEBP. Máximo de 5 MB.
                  </p>

                  {selectedFile && (
                    <p className="mt-2 text-xs text-emerald-400">
                      Imagem selecionada: {selectedFile.name}
                    </p>
                  )}

                  {form.image_url && !selectedFile && (
                    <p className="mt-2 break-all text-xs text-zinc-600">
                      Imagem atual: {form.image_url}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <label className="text-xs font-bold uppercase text-zinc-400 md:col-span-3">
              Descrição
              <textarea
                value={form.description ?? ""}
                onChange={(event) =>
                  setField("description", event.target.value)
                }
                className="admin-input min-h-24"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-5 text-xs font-bold text-zinc-400">
            {(
              [
                ["active", "Ativo"],
                ["featured", "Destaque"],
                ["bestseller", "Mais vendido"],
                ["is_new", "Novidade"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(event) =>
                    setField(key, event.target.checked)
                  }
                />

                {label}
              </label>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              disabled={saving || uploading}
              className="rounded-lg bg-red-600 px-5 py-3 text-xs font-black disabled:opacity-60"
            >
              {uploading
                ? "ENVIANDO IMAGEM..."
                : saving
                  ? "SALVANDO..."
                  : "SALVAR PRODUTO"}
            </button>

            {notice && (
              <span className="text-sm text-emerald-400">
                {notice}
              </span>
            )}

            {error && (
              <span className="text-sm text-red-400">
                {error}
              </span>
            )}
          </div>
        </form>

        <section className="mt-8">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar nome, SKU ou slug"
              className="admin-input flex-1"
            />

            <select
              value={filters.category}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  category: event.target.value,
                })
              }
              className="admin-input"
            >
              <option value="">
                Todas categorias
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={filters.active}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  active: event.target.value,
                })
              }
              className="admin-input"
            >
              <option value="">
                Ativo/inativo
              </option>
              <option value="true">
                Ativos
              </option>
              <option value="false">
                Inativos
              </option>
            </select>

            <select
              value={filters.status}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  status: event.target.value,
                })
              }
              className="admin-input"
            >
              <option value="">
                Todos status
              </option>

              {statuses.map((status) => (
                <option key={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={filters.featured}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  featured: event.target.value,
                })
              }
              className="admin-input"
            >
              <option value="">
                Destaque
              </option>
              <option value="true">
                Em destaque
              </option>
              <option value="false">
                Sem destaque
              </option>
            </select>
          </div>

          {loading ? (
            <p className="mt-8 text-sm text-zinc-500">
              Carregando produtos...
            </p>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[1150px] text-left text-sm">
                <thead className="bg-[#101216] text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    {[
                      "Imagem",
                      "Nome",
                      "Categoria",
                      "Apresentação",
                      "Preço",
                      "Promoção",
                      "Estoque",
                      "Status",
                      "Ativo",
                      "Destaque",
                      "Atualização",
                      "Ações",
                    ].map((label) => (
                      <th
                        key={label}
                        className="px-4 py-4"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-4 py-4">
                        {product.image_url ? (
                          <Image
                            loader={imageLoader}
                            unoptimized
                            src={product.image_url}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded bg-white/5 text-[9px] text-zinc-600">
                            SEM IMG
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-bold">
                          {product.name}
                        </p>

                        <p className="mt-1 text-xs text-zinc-600">
                          {product.sku} · {product.slug}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-zinc-400">
                        {categoryName(product.category)}
                      </td>

                      <td className="px-4 py-4 text-zinc-400">
                        {product.presentation || "-"}
                      </td>

                      <td className="px-4 py-4 font-bold">
                        {money(product.price)}
                      </td>

                      <td className="px-4 py-4 text-zinc-400">
                        {money(product.promo_price)}
                      </td>

                      <td className="px-4 py-4">
                        {product.stock_quantity}
                      </td>

                      <td className="px-4 py-4 text-xs">
                        {product.status}
                      </td>

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            void quickUpdate(product, {
                              active: !product.active,
                            })
                          }
                          className={
                            product.active
                              ? "text-emerald-400"
                              : "text-zinc-600"
                          }
                        >
                          {product.active
                            ? "ATIVO"
                            : "INATIVO"}
                        </button>
                      </td>

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            void quickUpdate(product, {
                              featured:
                                !product.featured,
                            })
                          }
                          className={
                            product.featured
                              ? "text-amber-300"
                              : "text-zinc-600"
                          }
                        >
                          {product.featured
                            ? "SIM"
                            : "NÃO"}
                        </button>
                      </td>

                      <td className="px-4 py-4 text-xs text-zinc-500">
                        {new Date(
                          product.updated_at,
                        ).toLocaleDateString("pt-BR")}
                      </td>

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => edit(product)}
                          className="rounded border border-white/15 px-3 py-2 text-xs font-bold"
                        >
                          EDITAR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!products.length && (
                <p className="p-10 text-center text-sm text-zinc-500">
                  Nenhum produto encontrado.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}