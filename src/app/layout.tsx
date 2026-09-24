import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://sfvapparel.my'),
  title: 'Kilang Cetak Jersi Sublimasi & DTF | SFV APPAREL',
  description:
    'Kilang cetak jersi sublimasi & baju DTF terus dari kilang Malaysia. Jersi kustom sukan, kelab & korporat berkualiti tinggi, harga kilang & siap 5-7 hari.',
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
    'jersi esport',
  ],
  authors: [{ name: 'SFV APPAREL' }, { name: 'AYEZZ Global' }],
  creator: 'SFV APPAREL',
  publisher: 'SFV Ventures Marketing',
  alternates: {
    canonical: 'https://sfvapparel.my/',
  },
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
    description:
      'Pengeluar jersi sublimasi penuh & cetakan DTF terus dari kilang. Kualiti premium, harga jimat, tiada had warna & siap pantas.',
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
    description:
      'Tempah jersi sublimasi penuh & t-shirt DTF terus dari kilang. Harga direct factory & kualiti terjamin.',
    images: ['/hero1.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/svf-icon.svg', type: 'image/svg+xml' },
      { url: '/logo/svf-icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/svf-icon.svg',
    apple: '/svf-icon.svg',
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
  themeColor: '#FFFFFF',
};

const gaId = process.env.NEXT_PUBLIC_GA_ID || 'G-SFVAPPAREL26';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ms"
      className={`h-full bg-white ${plusJakartaSans.variable} ${outfit.variable}`}
    >
      <head>
        <meta name="theme-color" content="#FFFFFF" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="msapplication-navbutton-color" content="#FFFFFF" />
        
        {/* Google Analytics GA4 Script (Non-blocking) */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />

        {/* Structured Data: Organization & LocalBusiness & FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'LocalBusiness',
                  '@id': 'https://sfvapparel.my/#business',
                  name: 'SFV APPAREL - Kilang Cetak Jersi Sublimasi & Baju DTF',
                  image: 'https://sfvapparel.my/hero1.png',
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
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: '4.95',
                    reviewCount: '2540',
                  },
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://sfvapparel.my/#website',
                  url: 'https://sfvapparel.my',
                  name: 'SFV APPAREL Malaysia',
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: 'https://sfvapparel.my/catalog?q={search_term_string}',
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': 'FAQPage',
                  '@id': 'https://sfvapparel.my/#faq',
                  mainEntity: [
                    {
                      '@type': 'Question',
                      name: 'Berapakah minimum tempahan untuk jersi sublimasi di SFV APPAREL?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Tiada minimum order! Anda boleh tempah bermula dari 1 helai sehingga ribuan helai dengan harga direct kilang.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Berapa hari tempoh siap tempahan jersi?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Tempoh siap standard adalah 5 hingga 7 hari bekerja selepas pengesahan rekaan artwork (Design Proof).',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Apakah format fail artwork yang diterima?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Kami menerima fail AI (Adobe Illustrator), PDF vektor, EPS, SVG, serta PNG/JPG resolusi tinggi (300 DPI).',
                      },
                    },
                  ],
                },
              ],
            }),
          }}
        />
      </head>
      <body className="h-full antialiased selection:bg-blue-500 selection:text-white overscroll-none">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
