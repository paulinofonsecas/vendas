import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";

import { ProgressBar } from "@/components/progress-bar";
import { PageView } from "@/components/analytics/page-view";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Vendaz — perfis, câmbio e design",
    template: "%s · Vendaz",
  },
  description:
    "Perfis de streaming, câmbio de divisas e design gráfico em Angola. Pedido em minutos, confirmação por WhatsApp.",
  applicationName: "Vendaz",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Vendaz",
    locale: "pt_AO",
    url: "/",
    title: "Vendaz — perfis, câmbio e design",
    description:
      "Perfis de streaming, câmbio de divisas e design gráfico em Angola. Pagamento em AOA.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vendaz — perfis, câmbio e design",
    description: "Perfis de streaming, câmbio e design em Angola. Confirmação por WhatsApp.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-AO"
      className={`${inter.variable} ${geistMono.variable} dark h-full antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <ProgressBar />
        <PageView />
        {children}
      </body>
    </html>
  );
}
