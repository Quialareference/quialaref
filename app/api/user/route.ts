import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const [user] = await db.select({
    id: users.id,
    username: users.username,
    email: users.email,
  }).from(users).where(eq(users.id, session.user.id)).limit(1);

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as { username?: string; email?: string; password?: string; currentPassword?: string };

  // Change username
  if (body.username !== undefined) {
    const u = body.username.trim();
    if (u.length < 2) return NextResponse.json({ error: "Pseudo trop court" }, { status: 400 });

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.username, u)).limit(1);
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "Ce pseudo est déjà pris." }, { status: 409 });
    }

    await db.update(users).set({ username: u, name: u }).where(eq(users.id, session.user.id));
    return NextResponse.json({ ok: true });
  }

  // Change email
  if (body.email !== undefined) {
    const e = body.email.trim().toLowerCase();
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, e)).limit(1);
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
    }

    await db.update(users).set({ email: e }).where(eq(users.id, session.user.id));
    return NextResponse.json({ ok: true });
  }

  // Change password
  if (body.password !== undefined) {
    if (!body.currentPassword) return NextResponse.json({ error: "Mot de passe actuel requis" }, { status: 400 });
    if (body.password.length < 6) return NextResponse.json({ error: "Mot de passe trop court" }, { status: 400 });

    const [user] = await db.select({ password: users.password }).from(users).where(eq(users.id, session.user.id)).limit(1);
    if (!user?.password) return NextResponse.json({ error: "Aucun mot de passe défini" }, { status: 400 });

    const valid = await bcrypt.compare(body.currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });

    const hashed = await bcrypt.hash(body.password, 12);
    await db.update(users).set({ password: hashed }).where(eq(users.id, session.user.id));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Delete sessions first, then user (cascade handles the rest)
  await db.delete(sessions).where(eq(sessions.userId, session.user.id));
  await db.delete(users).where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true });
}
