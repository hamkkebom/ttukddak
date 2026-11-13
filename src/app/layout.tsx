import type { Metadata } from "next";
import { Black_Han_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// 큰 제목·번호·로고에만 쓰는 굵은 글꼴 (font-display). 본문은 Pretendard 를 그대로 쓴다.
const displayFont = Black_Han_Sans({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-black-han",
  display: "swap",
});

const SITE_URL = "https://ttukddak.kr";
const SITE_NAME = "뚝딱";
const DEFAULT_TITLE = "뚝딱 - AI 영상 전문가를 만나는 가장 쉬운 방법";
const DEFAULT_DESC = "AI 영상 제작부터 모션그래픽, 유튜브 편집까지 300명 이상의 검증된 전문가가 기다리고 있습니다.";

export const metadata: Metadata = {
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESC,
  keywords: ["AI영상", "영상제작", "모션그래픽", "유튜브편집", "3D애니메이션", "재능마켓", "프리랜서", "영상편집"],
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body
        className={`${displayFont.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <FavoritesProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster position="top-right" />
          </FavoritesProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { send_page_view: true });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
