import { NextResponse, type NextRequest } from "next/server";
import { isPublicPath } from "@/middleware";
import { checkRateLimit, createRateLimitKey, getRequestFingerprint, pruneRateLimitBuckets, validateRequestOrigin } from "@/lib/production/security";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  pruneRateLimitBuckets();

  if (pathname.startsWith("/api/health")) {
    return NextResponse.next();
  }

  const fingerprint = getRequestFingerprint(request);
  const authLimit = pathname.startsWith("/login") || pathname.startsWith("/api/auth") ? { limit: 20, windowMs: 5 * 60 * 1000 } : { limit: 120, windowMs: 60 * 1000 };
  const rateLimit = checkRateLimit(createRateLimitKey(pathname.startsWith("/api/auth") || pathname === "/login" ? "auth" : "request", fingerprint), authLimit.limit, authLimit.windowMs);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "RATE_LIMITED",
        message: "Muitas requisições. Tente novamente em instantes.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(Math.ceil((rateLimit.resetAt - Date.now()) / 1000), 1)),
        },
      }
    );
  }

  if (!validateRequestOrigin(request)) {
    return NextResponse.json(
      {
        error: "CSRF_BLOCKED",
        message: "Origem da requisição inválida.",
      },
      { status: 403 }
    );
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\..*).*)"],
};
