import { lookupDebtor } from "@/lib/debtor-lookup";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!/^\d{7,11}$/.test(id)) {
    return NextResponse.json({ error: "Invalid CUIT/CUIL" }, { status: 400 });
  }

  const body = await lookupDebtor(id);
  const status =
    body.unavailable.deudas && body.unavailable.historial ? 503 : 200;

  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 12;
export const preferredRegion = "gru1";
