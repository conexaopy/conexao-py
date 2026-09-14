import type { Order } from "./orderTypes";

const ORDER_KEY = "conexao-py-orders";

export function getOrders(): Order[] { if (typeof window === "undefined") return []; const saved = localStorage.getItem(ORDER_KEY); return saved ? JSON.parse(saved) : []; }
export function saveOrder(order: Order): void { localStorage.setItem(ORDER_KEY, JSON.stringify([...getOrders(), order])); }
export function createOrderNumber(): string { const numbers = getOrders().map((order) => Number(order.orderNumber.replace("CPY-", ""))).filter(Number.isFinite); return `CPY-${Math.max(1000, ...numbers) + 1}`; }
