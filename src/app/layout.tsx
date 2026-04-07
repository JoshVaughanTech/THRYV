import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'THRYV — Train with the Best Coaches on Earth',
  description:
    'Access structured programs from elite coaches, track every workout, build momentum, and join a community that pushes you forward.',
  keywords: ['fitness', 'training', 'coaching', 'workout tracker', 'programs'],
  openGraph: {
    title: 'THRYV — Train with the Best Coaches on Earth',
    description:
      'Access structured programs from elite coaches, track every workout, build momentum, and join a community that pushes you forward.',
    siteName: 'THRYV',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'THRYV — Train with the Best Coaches on Earth',
    description:
      'Access structured programs from elite coaches, track every workout, build momentum, and join a community that pushes you forward.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
