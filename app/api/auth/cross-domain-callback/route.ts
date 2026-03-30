import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { encode } from "next-auth/jwt";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET);

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const redirectTo = req.nextUrl.searchParams.get("redirect") ?? "/";

  if (!token) return NextResponse.redirect(new URL("/auth/signin", req.url));

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.sub as string;

    const [user] = await db
      .select({ id: users.id, email: users.email, username: users.username })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return NextResponse.redirect(new URL("/auth/signin", req.url));

    // Create a NextAuth JWT session token
    const sessionToken = await encode({
      token: {
        id: user.id,
        email: user.email,
        name: user.username,
        username: user.username,
        sub: user.id,
      },
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "",
    });

    const isSecure = req.nextUrl.protocol === "https:";
    const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";

    const response = NextResponse.redirect(new URL(redirectTo, req.url));
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }
}
