import { NextResponse } from "next/server";
import { getRefsForAdmin } from "@/lib/db/queries/refs";

function checkAdmin(req: Request) {
  const secret = req.headers.get("x-admin-secret");
  return secret === process.env.ADMIN_SECRET;
}

export async function GET(req: Request) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const refs = await getRefsForAdmin();
  return NextResponse.json(refs);
}
