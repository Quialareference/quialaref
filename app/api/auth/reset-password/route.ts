import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  const { email, token, password } = await req.json();
  if (!email || !token || !password) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères." }, { status: 400 });
  }

  const identifier = `reset:${email}`;
  const [row] = await db
    .select()
    .from(verificationTokens)
    .where(and(eq(verificationTokens.identifier, identifier), eq(verificationTokens.token, token)))
    .limit(1);

  if (!row) return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 400 });
  if (row.expires < new Date()) {
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier));
    return NextResponse.json({ error: "Le lien a expiré. Refais une demande." }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);
  await db.update(users).set({ password: hashed }).where(eq(users.email, email));
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier));

  return NextResponse.json({ ok: true });
}
