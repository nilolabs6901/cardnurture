import type { Metadata, Viewport } from 'next';
import { DM_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CardNurture',
  description: 'Business card scanner & nurture CRM for Combilift sales',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CardNurture',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // viewportFit: 'cover' is what makes env(safe-area-inset-*) resolve to real
  // values on notched iPhones. Without it those insets are always 0 and the
  // fixed bottom nav sits under the home indicator.
  viewportFit: 'cover',
  // Deliberately no maximumScale: pinch-zoom stays available for reading
  // OCR output and card photos on a phone.
  themeColor: '#0F1117',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceGrotesk.variable}`}>
      <body className="font-[var(--font-dm-sans)] bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen antialiased">
        <Navbar />
        <main className="pb-nav">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
