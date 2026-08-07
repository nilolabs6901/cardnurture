import { NextRequest, NextResponse } from 'next/server';

/**
 * There is no sign-in screen. Access is gated on a single shared secret:
 * visit any URL once with ?key=<APP_ACCESS_KEY> and the value is stored in an
 * httpOnly cookie, so the gate is invisible from then on for that browser.
 */

const COOKIE_NAME = 'cardnurture_access';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // one year

/** Avoids leaking secret length/content through response timing. */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
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

  const providedKey = request.nextUrl.searchParams.get('key');
  if (providedKey && constantTimeEqual(providedKey, secret)) {
    // Redirect to the same URL without the key so it does not linger in
    // browser history, bookmarks, or an outbound Referer header.
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete('key');

    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set(COOKIE_NAME, secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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

  // 404 rather than 401: an unauthenticated visitor gets no signal that
  // anything is hosted here.
  return new NextResponse('Not found', { status: 404 });
}

export const config = {
  matcher: [
    // api/cron is deliberately excluded. It authenticates with CRON_SECRET so
    // an external scheduler can reach it without a browser cookie -- under the
    // old middleware it was covered by the session check, which redirected
    // scheduler calls to the login page and made the endpoint unreachable.
    '/((?!api/cron|_next/static|_next/image|favicon.ico|manifest.json|icon-192.png).*)',
  ],
};
