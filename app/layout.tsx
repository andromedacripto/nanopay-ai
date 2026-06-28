import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NanoPay AI – Pague apenas pela inteligência que usar",
  description:
    "IA alimentada por micropagamentos em USDC na blockchain Arc. Sem assinaturas, sem conta. Pague por pergunta.",
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
  openGraph: {
    title: "NanoPay AI",
    description: "Pague apenas pela inteligência que usar.",
    type: "website",
    locale: "pt_BR",
    siteName: "NanoPay AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "NanoPay AI",
    description: "IA + USDC micropayments na Arc blockchain.",
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

/**
 * Layout raiz da aplicação.
 * Define estrutura HTML base, fontes e metadados globais.
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="flex min-h-dvh flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
