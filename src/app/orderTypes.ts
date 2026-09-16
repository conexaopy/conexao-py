import type { Product } from "./data";

export type OrderStatus = "AGUARDANDO PAGAMENTO" | "PAGAMENTO CONFIRMADO" | "PRODUTO CONFIRMADO" | "PREPARANDO ENVIO" | "ENVIADO" | "RASTREIO DISPONÍVEL" | "ENTREGUE" | "CANCELADO";

export type Customer = { name: string; cpf: string; whatsapp: string; email: string };
export type Address = { cep: string; street: string; number: string; complement: string; neighborhood: string; city: string; state: string };
export type OrderItem = Pick<Product, "id" | "name" | "presentation" | "price" | "accent"> & { quantity: number };
export type Order = { id: string; orderNumber: string; createdAt: string; status: OrderStatus; customer: Customer; address: Address; items: OrderItem[]; subtotal: number; discount: number; shipping: number; total: number; couponCode?: string | null };
