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

export const metadata: Metadata = {
  title: "BaoSocial - Tin tức thế hệ mới",
  description: "Nền tảng tin tức tổng hợp thông minh",
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
