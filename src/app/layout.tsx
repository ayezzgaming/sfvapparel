import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://sfvapparel.my'),
  title: 'Kilang Cetak Jersi Sublimasi & Baju DTF | SFV APPAREL Malaysia',
  description: 'Kilang cetak jersi sublimasi & baju DTF terus dari kilang di Malaysia. Tempah jersi kustom sukan, e-sukan, korporat dan t-shirt DTF berkualiti tinggi dengan harga kilang & siap pantas 5-7 hari.',
  keywords: [
    'Kilang Cetak Jersi Sublimasi & Baju DTF',
    'kilang cetak jersi sublimasi',
    'cetak baju dtf',
    'kilang jersi sublimasi malaysia',
    'tempah jersi custom',
    'cetak baju dtf murah',
    'sublimation jersey printing',
    'kilang jersi selangor',
    'print jersi berkualiti',
    'kilang baju custom direct factory',
    'jersi bola sublimasi',
    'jersi esport'
  ],
  authors: [{ name: 'SFV APPAREL' }, { name: 'AYEZZ Global' }],
  creator: 'SFV APPAREL',
  publisher: 'SFV Ventures Marketing',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ms_MY',
    url: 'https://sfvapparel.my',
    siteName: 'SFV APPAREL',
    title: 'Kilang Cetak Jersi Sublimasi & Baju DTF | SFV APPAREL Malaysia',
    description: 'Pengeluar jersi sublimasi penuh & cetakan DTF terus dari kilang. Kualiti premium, harga jimat, tiada had warna & siap pantas.',
    images: [
      {
        url: '/hero1.png',
        width: 1200,
        height: 630,
        alt: 'Kilang Cetak Jersi Sublimasi & Baju DTF SFV APPAREL',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kilang Cetak Jersi Sublimasi & Baju DTF | SFV APPAREL',
    description: 'Tempah jersi sublimasi penuh & t-shirt DTF terus dari kilang. Harga direct factory & kualiti terjamin.',
    images: ['/hero1.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/logo/svf-icon.svg',
    shortcut: '/logo/svf-icon.svg',
    apple: '/logo/svf-icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SFV Apparel',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#00BDFF',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: 'SFV APPAREL - Kilang Cetak Jersi Sublimasi & Baju DTF',
              image: 'https://sfvapparel.my/hero1.png',
              '@id': 'https://sfvapparel.my',
              url: 'https://sfvapparel.my',
              telephone: '+60148599138',
              priceRange: 'RM5 - RM50',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'No 28-1, Jalan Prima Saujana 2/D, Taman Prima Saujana',
                addressLocality: 'Kajang',
                addressRegion: 'Selangor',
                postalCode: '43000',
                addressCountry: 'MY',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 2.9935,
                longitude: 101.7925,
              },
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                  opens: '09:00',
                  closes: '18:00',
                },
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Saturday'],
                  opens: '09:00',
                  closes: '13:00',
                },
              ],
              description:
                'Kilang cetak jersi sublimasi penuh & baju DTF terus dari kilang di Malaysia. Tempahan jersi sukan, kelab, korporat dan t-shirt tanpa minimum order dengan harga jimat.',
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Perkhidmatan Cetakan Pakaian',
                itemListElement: [
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Cetak Jersi Sublimasi Penuh (Full Sublimation Jersey)',
                      description: 'Cetakan jersi berdefinisi tinggi, fabrik Microfiber Eyelet serap peluh, tiada had warna.',
                    },
                  },
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Cetakan Baju DTF Premium (Direct-to-Film)',
                      description: 'Cetakan kualiti fotografi pada fabrik 100% Combed Cotton, tiada minimum order.',
                    },
                  },
                ],
              },
            }),
          }}
        />
      </head>
      <body className="h-full antialiased selection:bg-blue-500 selection:text-white overscroll-none">
        {children}
      </body>
    </html>
  );
}
