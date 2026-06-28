import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NanoPay AI - Pay only for the intelligence you use",
  description:
    "AI powered by USDC stablecoin micropayments on the Arc blockchain. No subscriptions, no account. Pay per question.",
  keywords: [
    "AI",
    "USDC",
    "micropayments",
    "Arc blockchain",
    "stablecoin",
    "Web3",
    "artificial intelligence",
  ],
  authors: [{ name: "NanoPay AI Team" }],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "NanoPay AI",
    description: "Pay only for the intelligence you use.",
    type: "website",
    locale: "en_US",
    siteName: "NanoPay AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "NanoPay AI",
    description: "AI + USDC micropayments on Arc blockchain.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#050810",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-dvh flex-col antialiased">
        {children}
      </body>
    </html>
  );
}