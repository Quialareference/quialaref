import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { username, password } = await req.json() as { username: string; password: string };

  if (!username || username.trim().length < 2) {
    return NextResponse.json({ error: "Pseudo invalide" }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Mot de passe trop court" }, { status: 400 });
  }

  // Check username uniqueness
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.username, username.trim())).limit(1);
  if (existing) {
    return NextResponse.json({ error: "Ce pseudo est déjà pris." }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await db.update(users)
    .set({ username: username.trim(), password: hashedPassword, name: username.trim() })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true });
}
