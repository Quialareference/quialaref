import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { randomUUID } from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email manquant" }, { status: 400 });

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  // Always return success to avoid email enumeration
  if (!user) return NextResponse.json({ ok: true });

  const token = randomUUID();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  const identifier = `reset:${email}`;

  // Delete any existing reset token for this email
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier));
  await db.insert(verificationTokens).values({ identifier, token, expires });

  const origin = req.headers.get("origin") ?? "https://quialaref.fr";
  const resetUrl = `${origin}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@quialaref.fr",
    to: email,
    subject: "Réinitialisation de ton mot de passe — Qui a la réf ?",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #18181b; color: #fff; border-radius: 16px;">
        <h2 style="margin: 0 0 16px; font-size: 22px;">Réinitialisation du mot de passe</h2>
        <p style="color: #a1a1aa; margin: 0 0 24px; font-size: 15px;">
          Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous — le lien expire dans <strong style="color: #fff;">1 heure</strong>.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #facc15; color: #000; font-weight: 700; font-size: 15px; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
          Réinitialiser mon mot de passe
        </a>
        <p style="color: #52525b; font-size: 12px; margin: 24px 0 0;">
          Si tu n'as pas fait cette demande, ignore cet email.
        </p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
