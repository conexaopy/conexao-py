import "server-only";

import { getSupabaseServerClient } from "./server";

type CouponRow = {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number | string;
  minimum_order: number | string | null;
  maximum_discount: number | string | null;
  usage_limit: number | null;
  used_count: number | null;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
};

export type ValidatedCoupon = {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  discount: number;
};

function couponError(message: string): Error & { status?: number } {
  const error = new Error(message) as Error & { status?: number };
  error.status = 400;
  return error;
}

export async function validateCoupon(
  code: string,
  subtotal: number,
): Promise<ValidatedCoupon> {
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode || normalizedCode.length > 100) {
    throw couponError("Informe um cupom válido.");
  }

  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    throw couponError("O subtotal do pedido é inválido.");
  }

  const client = getSupabaseServerClient();

  const { data: coupon, error } = await client
    .from("coupons")
    .select(
      "id,code,description,discount_type,discount_value,minimum_order,maximum_discount,usage_limit,used_count,starts_at,expires_at,active",
    )
    .eq("code", normalizedCode)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível validar o cupom.");
  }

  if (!coupon) {
    throw couponError("Cupom não encontrado.");
  }

  const row = coupon as CouponRow;

  if (!row.active) {
    throw couponError("Este cupom não está ativo.");
  }

  const now = Date.now();

  if (row.starts_at && new Date(row.starts_at).getTime() > now) {
    throw couponError("Este cupom ainda não está válido.");
  }

  if (row.expires_at && new Date(row.expires_at).getTime() < now) {
    throw couponError("Este cupom expirou.");
  }

  const minimumOrder = Number(row.minimum_order ?? 0);

  if (subtotal < minimumOrder) {
    throw couponError(
      `Este cupom exige pedido mínimo de R$ ${minimumOrder.toFixed(2).replace(".", ",")}.`,
    );
  }

  const usedCount = Number(row.used_count ?? 0);

  if (row.usage_limit !== null && usedCount >= row.usage_limit) {
    throw couponError("Este cupom atingiu o limite de utilizações.");
  }

  const discountValue = Number(row.discount_value);

  if (!Number.isFinite(discountValue) || discountValue < 0) {
    throw new Error("Configuração de cupom inválida.");
  }

  let discount =
    row.discount_type === "FIXED"
      ? discountValue
      : subtotal * (discountValue / 100);

  if (row.maximum_discount !== null) {
    discount = Math.min(discount, Number(row.maximum_discount));
  }

  discount = Math.min(Math.max(discount, 0), subtotal);

  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discountType:
      row.discount_type === "FIXED" ? "FIXED" : "PERCENTAGE",
    discountValue,
    discount: Number(discount.toFixed(2)),
  };
}
