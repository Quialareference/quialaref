import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const h = await headers();
  return NextResponse.json({
    host: h.get("host"),
    "x-forwarded-host": h.get("x-forwarded-host"),
    "x-pathname": h.get("x-pathname"),
  });
}
