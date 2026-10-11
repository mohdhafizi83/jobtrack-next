import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Per-request CSP with a fresh nonce (Next 16's documented approach — see
 * node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
 *
 * Next.js ships inline bootstrap/flight scripts on every page, so
 * `script-src 'self'` alone would break hydration. Rather than weakening the
 * policy with 'unsafe-inline', we generate a one-time nonce per request; the
 * page is dynamically rendered (connection() + instant = false in app/page.tsx),
 * so Next attaches the nonce to its own inline scripts automatically.
 *
 * 'unsafe-eval' is dev-only (React dev-mode error stacks); production builds
 * never emit it.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'none';
    form-action 'none';
    frame-ancestors 'none';
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", cspHeader);
  return response;
}

export const config = {
  matcher: [
    {
      // All pages except API routes (CSP via next.config headers) and static
      // assets; skip router prefetches per Next docs.
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
