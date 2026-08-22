# Capacitor hosted shell

CardNurture's native package is a thin Capacitor WebView shell. Next.js, Prisma,
OCR, authentication, and customer data remain on the hosted CardNurture server;
they are not copied into the native bundle.

## Configure the hosted app

Set `CAPACITOR_SERVER_URL` to the HTTPS URL of the deployed CardNurture app when
running Capacitor commands:

```sh
CAPACITOR_SERVER_URL=https://cardnurture.example.com npx cap doctor
CAPACITOR_SERVER_URL=https://cardnurture.example.com npx cap sync
```

When the variable is absent, `capacitor-web/index.html` is used as a local,
responsive fallback that explains how to configure the URL. The configuration
rejects non-HTTPS hosted URLs and keeps Android's WebView scheme on HTTPS.

Native platform projects are generated with `npx cap add ios` or
`npx cap add android` only on machines with the corresponding Apple or Android
SDK installed.
