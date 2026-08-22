import { NextRequest, NextResponse } from 'next/server';

/**
 * There is no sign-in account. Access is gated on a single shared secret,
 * APP_ACCESS_KEY, entered once per device on /unlock and then remembered in an
 * httpOnly cookie.
 *
 * An earlier version answered every unauthenticated request with a bare 404 so
 * that a stranger got no signal the app existed. That also meant the owner got
 * no signal: a wrong key, a missing key, a mistyped URL, and a dead server all
 * produced the identical blank page, which made being locked out impossible to
 * diagnose. The unlock page trades that opacity for a usable failure message.
 */

const COOKIE_NAME = 'cardnurture_access';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // one year
const UNLOCK_PATH = '/unlock';

/** Avoids leaking secret length/content through response timing. */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function redirectTo(request: NextRequest, pathname: string, search = '') {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = search;
  return NextResponse.redirect(url);
}

export function middleware(request: NextRequest) {
  const secret = process.env.APP_ACCESS_KEY;

  // Fail closed, matching the nurture cron endpoint: a missing secret refuses
  // every request rather than quietly serving the app to the whole internet.
  if (!secret) {
    return new NextResponse(
      'APP_ACCESS_KEY is not configured. Set it in the environment.',
      { status: 503 }
    );
  }

  // The unlock page must stay reachable without a cookie, or there is no way in.
  if (request.nextUrl.pathname === UNLOCK_PATH) {
    return NextResponse.next();
  }

  // A key can arrive from the unlock form (which submits here as a GET) or
  // from a ?key=... link pasted directly.
  const providedKey = request.nextUrl.searchParams.get('key');
  if (providedKey !== null) {
    if (!constantTimeEqual(providedKey.trim(), secret.trim())) {
      return redirectTo(request, UNLOCK_PATH, '?error=key');
    }

    // Strip the key from the URL so it does not linger in browser history,
    // bookmarks, or an outbound Referer header.
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete('key');

    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set(COOKIE_NAME, secret, {
      httpOnly: true,
      // Railway terminates TLS in front of the app, so the browser's connection
      // is https even though this process sees http. Trust the forwarded proto
      // rather than NODE_ENV, and fall back to insecure only for local http.
      secure: request.headers.get('x-forwarded-proto') === 'https'
        || request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });
    return response;
  }

  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (cookie && constantTimeEqual(cookie, secret)) {
    return NextResponse.next();
  }

  return redirectTo(request, UNLOCK_PATH);
}

export const config = {
  matcher: [
    // api/cron is deliberately excluded. It authenticates with CRON_SECRET so
    // an external scheduler can reach it without a browser cookie.
    '/((?!api/cron|_next/static|_next/image|favicon.ico|manifest.json|icon-192.png).*)',
  ],
};
