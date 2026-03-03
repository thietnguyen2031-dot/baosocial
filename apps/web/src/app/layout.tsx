import type { Metadata } from "next";
import { Newsreader, Roboto } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://benthanhmedia.net';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'BaoSocial - Tin tức thế hệ mới',
    template: '%s | BaoSocial',
  },
  description: 'Nền tảng tin tức tổng hợp thông minh - cập nhật tin tức mới nhất từ các nguồn uy tín.',
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: SITE_URL,
    siteName: 'BaoSocial',
    title: 'BaoSocial - Tin tức thế hệ mới',
    description: 'Nền tảng tin tức tổng hợp thông minh - cập nhật tin tức mới nhất từ các nguồn uy tín.',
    images: [`${SITE_URL}/og-default.jpg`],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@baosocial',
    creator: '@baosocial',
    title: 'BaoSocial - Tin tức thế hệ mới',
    description: 'Nền tảng tin tức tổng hợp thông minh',
    images: [`${SITE_URL}/og-default.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${newsreader.variable} ${roboto.variable} antialiased bg-[var(--color-background)] text-[var(--color-text)]`}
      >
        {children}
      </body>
    </html>
  );
}
