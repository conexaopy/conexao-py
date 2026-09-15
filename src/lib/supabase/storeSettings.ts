import "server-only";

import { getSupabaseServerClient } from "./server";

export type StorePublicSettings = {
  name: string;
  shippingFee: number;
  freeShippingFrom: number;
  noticeEnabled: boolean;
  noticeText: string;
  whatsappUrl: string;
  whatsappGroupUrl: string;
};

const WA_BASE = "https:" + "//wa.me/";
const GROUP_BASE = "https:" + "//chat.whatsapp.com/";

const defaults: StorePublicSettings = {
  name: "CONEXÃO PY",
  shippingFee: 34.99,
  freeShippingFrom: 1000,
  noticeEnabled: true,
  noticeText: "Envios para todo o Brasil.",
  whatsappUrl: WA_BASE + "5545991294914",
  whatsappGroupUrl:
    GROUP_BASE +
    "GPkNMzZbMPFGigAQXTC6iT?s=cl&p=a&mlu=4&ilr=4",
};

function validNumber(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

export async function getStoreSettings(): Promise<StorePublicSettings> {
  const client = getSupabaseServerClient();

  const { data, error } = await client
    .from("settings")
    .select("key,value")
    .in("key", ["store", "whatsapp", "whatsapp_group"]);

  if (error) {
    return defaults;
  }

  const rows = data ?? [];

  const storeRow = rows.find((item) => item.key === "store");
  const whatsappRow = rows.find((item) => item.key === "whatsapp");
  const groupRow = rows.find((item) => item.key === "whatsapp_group");

  const store =
    storeRow?.value && typeof storeRow.value === "object"
      ? (storeRow.value as Record<string, unknown>)
      : {};

  const whatsapp =
    whatsappRow?.value && typeof whatsappRow.value === "object"
      ? (whatsappRow.value as Record<string, unknown>)
      : {};

  const group =
    groupRow?.value && typeof groupRow.value === "object"
      ? (groupRow.value as Record<string, unknown>)
      : {};

  const whatsappNumber =
    typeof whatsapp.number === "string"
      ? whatsapp.number.replace(/\D/g, "")
      : "";

  const whatsappGroupUrl =
    typeof group.url === "string" &&
    group.url.startsWith("https://chat.whatsapp.com/")
      ? group.url
      : defaults.whatsappGroupUrl;

  return {
    name:
      typeof store.name === "string" && store.name.trim()
        ? store.name
        : defaults.name,

    shippingFee: validNumber(
      store.shipping_fee,
      defaults.shippingFee
    ),

    freeShippingFrom: validNumber(
      store.free_shipping_from,
      defaults.freeShippingFrom
    ),

    noticeEnabled:
      typeof store.notice_enabled === "boolean"
        ? store.notice_enabled
        : defaults.noticeEnabled,

    noticeText:
      typeof store.notice_text === "string"
        ? store.notice_text
        : defaults.noticeText,

    whatsappUrl: whatsappNumber
      ? WA_BASE + whatsappNumber
      : defaults.whatsappUrl,

    whatsappGroupUrl,
  };
}
