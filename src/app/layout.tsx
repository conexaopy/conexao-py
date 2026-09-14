import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./CartProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rootLanguage = "pt-BR";
const rootClassName = `${geistSans.variable} ${geistMono.variable} h-full antialiased`;

export const metadata: Metadata = {
  title: "CONEXÃO PY | Loja Oficial",
  description: "Produtos, novidades e atendimento em um só lugar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={rootLanguage}
      className={rootClassName}
    >
      <body className="min-h-full flex flex-col"><CartProvider>{children}</CartProvider></body>
    </html>
  );
}
