import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;
  const isWikiDomain = hostname.includes("wikiref.fr");

  // Sur wikiref.fr : réécrire / et /:path* vers /wiki et /wiki/:path*
  if (isWikiDomain) {
    if (!pathname.startsWith("/wiki") && !pathname.startsWith("/_next") && !pathname.startsWith("/api")) {
      const newPath = pathname === "/" ? "/wiki" : `/wiki${pathname}`;
      const url = request.nextUrl.clone();
      url.pathname = newPath;
      const response = NextResponse.rewrite(url);
      response.headers.set("x-pathname", newPath);
      return response;
    }
  }

  // Sur quialaref.fr : /wiki/* → redirect vers wikiref.fr
  if (!isWikiDomain && pathname.startsWith("/wiki")) {
    const newPath = pathname.replace("/wiki", "") || "/";
    return NextResponse.redirect(`https://wikiref.fr${newPath}`);
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.ico$).*)"],
};
