import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SFV APPAREL | Custom Sublimation & DTF Printing',
  description: 'Premium Custom Apparel Manufacturing: Full Sublimation Jerseys & Direct-to-Film (DTF) Transfers',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SFV APPAREL',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0052FF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Unregister stale service workers
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for (let registration of registrations) {
                    registration.unregister();
                  }
                });
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    for (let name of names) caches.delete(name);
                  });
                }
              }

              // Mobile First: Prevent pinch zoom, double-tap zoom & gesture zoom
              if (typeof window !== 'undefined') {
                // Prevent multi-touch pinch zoom
                document.addEventListener('touchstart', function(e) {
                  if (e.touches.length > 1) {
                    e.preventDefault();
                  }
                }, { passive: false });

                // Prevent iOS Safari gesture zoom
                document.addEventListener('gesturestart', function(e) {
                  e.preventDefault();
                }, { passive: false });
                document.addEventListener('gesturechange', function(e) {
                  e.preventDefault();
                }, { passive: false });
                document.addEventListener('gestureend', function(e) {
                  e.preventDefault();
                }, { passive: false });

                // Prevent double tap to zoom
                var lastTouchEnd = 0;
                document.addEventListener('touchend', function(e) {
                  var now = (new Date()).getTime();
                  if (now - lastTouchEnd <= 300) {
                    // Check if not clicking on standard input
                    var tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
                    if (tag !== 'input' && tag !== 'textarea') {
                      e.preventDefault();
                    }
                  }
                  lastTouchEnd = now;
                }, false);
              }
            `,
          }}
        />
      </head>
      <body className="h-full antialiased selection:bg-blue-500 selection:text-white overscroll-none">
        {children}
      </body>
    </html>
  );
}
