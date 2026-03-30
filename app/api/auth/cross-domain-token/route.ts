import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { SignJWT } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET);

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Short-lived token (60s) carrying the user id
  const token = await new SignJWT({ sub: session.user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("60s")
    .setIssuedAt()
    .sign(secret);

  return NextResponse.json({ token });
}
