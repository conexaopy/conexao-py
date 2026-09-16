import "server-only";

import {
  normalizeDigits,
  validateCPF,
  validateFullName,
  validatePhone,
} from "../../app/checkoutUtils";
import type { Address, Customer } from "../../app/orderTypes";

type CartInput = {
  id: string;
  quantity: number;
};

export type ValidatedOrderInput = {
  requestId: string;
  customer: Customer;
  address: Address;
  items: CartInput[];
  couponCode?: string;
};

function invalid(message: string): never {
  const error = new Error(message) as Error & { status?: number };
  error.status = 400;
  throw error;
}

function text(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  const result = value.trim();
  if (result.length > maxLength) invalid("Um ou mais campos excedem o tamanho permitido.");
  return result;
}

export function validateOrderInput(value: unknown): ValidatedOrderInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    invalid("Dados do pedido inválidos.");
  }

  const input = value as Record<string, unknown>;

  const requestId = text(input.requestId, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    invalid("Identificador do pedido inválido.");
  }

  if (!input.customer || typeof input.customer !== "object" || Array.isArray(input.customer)) {
    invalid("Dados do cliente inválidos.");
  }

  if (!input.address || typeof input.address !== "object" || Array.isArray(input.address)) {
    invalid("Endereço inválido.");
  }

  const rawCustomer = input.customer as Record<string, unknown>;
  const rawAddress = input.address as Record<string, unknown>;

  const customer: Customer = {
    name: text(rawCustomer.name, 120),
    cpf: normalizeDigits(text(rawCustomer.cpf, 20)),
    whatsapp: normalizeDigits(text(rawCustomer.whatsapp, 20)),
    email: text(rawCustomer.email, 254).toLowerCase(),
  };

  if (!validateFullName(customer.name)) invalid("Informe o nome completo.");
  if (!validateCPF(customer.cpf)) invalid("CPF inválido.");
  if (!validatePhone(customer.whatsapp)) invalid("WhatsApp inválido.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) invalid("E-mail inválido.");

  const address: Address = {
    cep: normalizeDigits(text(rawAddress.cep, 12)),
    street: text(rawAddress.street, 150),
    number: text(rawAddress.number, 30),
    complement: text(rawAddress.complement, 100),
    neighborhood: text(rawAddress.neighborhood, 100),
    city: text(rawAddress.city, 100),
    state: text(rawAddress.state, 2).toUpperCase(),
  };

  if (!/^\d{8}$/.test(address.cep)) invalid("CEP inválido.");
  if (!address.street || !address.number || !address.neighborhood || !address.city) {
    invalid("Dados obrigatórios do endereço incompletos.");
  }
  if (!/^[A-Z]{2}$/.test(address.state)) invalid("Estado inválido.");

  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > 100) {
    invalid("Carrinho inválido.");
  }

  const items: CartInput[] = input.items.map((rawItem) => {
    if (!rawItem || typeof rawItem !== "object" || Array.isArray(rawItem)) {
      invalid("Item do carrinho inválido.");
    }

    const item = rawItem as Record<string, unknown>;
    const id = text(item.id, 100);
    const quantity = item.quantity;

    if (!id || typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
      invalid("Item do carrinho inválido.");
    }

    return { id, quantity };
  });

  const couponCode =
    typeof input.couponCode === "string"
      ? input.couponCode.trim().toUpperCase()
      : "";

  if (couponCode.length > 100) {
    invalid("Cupom inválido.");
  }

  return {
    requestId,
    customer,
    address,
    items,
    couponCode: couponCode || undefined,
  };
}
