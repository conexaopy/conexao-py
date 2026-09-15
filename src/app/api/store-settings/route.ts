import { NextResponse } from "next/server";
import { getStoreSettings } from "../../../lib/supabase/storeSettings";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getStoreSettings();

  return NextResponse.json(settings, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
