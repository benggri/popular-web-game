import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

// Galmuri11 by Lee Minseo, SIL Open Font License 1.1 (see fonts/OFL.md)
const galmuri = localFont({
  src: [
    { path: "./fonts/Galmuri11.woff2", weight: "400" },
    { path: "./fonts/Galmuri11-Bold.woff2", weight: "700" },
  ],
  variable: "--font-galmuri",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ember Tail — 픽셀 서바이버",
  description:
    "포인터를 따라 움직이는 유령불이 되어 몰려오는 괴물을 태우세요. 같은 주문을 고르면 2048처럼 합쳐져 강해집니다.",
  openGraph: {
    title: "Ember Tail — 픽셀 서바이버",
    description: "Slither 조작 + 서바이버 + 2048 합성 + 방치형 성장. 브라우저에서 바로.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0c0a12",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={galmuri.variable}>
      <head>
        {/* Google AdSense: a plain tag, since next/script's data-nscript attribute trips AdSense's head check */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9245086971599023"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
