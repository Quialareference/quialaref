import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";

  const pathname = request.nextUrl.pathname;
  const isWikiDomain = hostname.includes("wikiref");

  // Headers à injecter dans la request pour que le layout les lise
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-hostname", hostname);

  // Sur wikiref.fr : réécrire vers /wiki/*
  if (isWikiDomain) {
    if (
      !pathname.startsWith("/wiki") &&
      !pathname.startsWith("/_next") &&
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/auth") &&
      !pathname.startsWith("/settings") &&
      !pathname.startsWith("/submit")
    ) {
      const newPath = pathname === "/" ? "/wiki" : `/wiki${pathname}`;
      const url = request.nextUrl.clone();
      url.pathname = newPath;
      requestHeaders.set("x-pathname", newPath);
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Sur quialaref.fr : /wiki/* → redirect vers wikiref.fr
  if (pathname.startsWith("/wiki")) {
    const newPath = pathname.replace(/^\/wiki/, "") || "/";
    return NextResponse.redirect(`https://wikiref.fr${newPath}`);
  }

  // Sur quialaref.fr : /submit → redirect vers wikiref.fr/submit
  if (pathname.startsWith("/submit")) {
    return NextResponse.redirect(`https://wikiref.fr/submit`);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.ico$).*)"],
};
