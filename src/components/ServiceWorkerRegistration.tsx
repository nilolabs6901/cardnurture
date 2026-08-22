'use client';

import { useEffect } from 'react';

/**
 * Register the production service worker without making it part of the server
 * render. Keeping this as a client component preserves the server-rendered
 * Next.js layout and avoids touching navigator during SSR.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }

    void navigator.serviceWorker.register('/sw.js', { scope: '/' });
  }, []);

  return null;
}
