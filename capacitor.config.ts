import type { CapacitorConfig } from '@capacitor/cli';

const configuredUrl = process.env.CAPACITOR_SERVER_URL?.trim();

if (configuredUrl) {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(configuredUrl);
  } catch {
    throw new Error('CAPACITOR_SERVER_URL must be a valid HTTPS URL.');
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new Error('CAPACITOR_SERVER_URL must use HTTPS.');
  }
}

const config: CapacitorConfig = {
  appId: 'com.cardnurture.app',
  appName: 'CardNurture',
  webDir: 'capacitor-web',
  server: {
    ...(configuredUrl ? { url: configuredUrl } : {}),
    // Keep Android navigation on a secure, routable WebView scheme.
    androidScheme: 'https',
    cleartext: false,
  },
};

export default config;
