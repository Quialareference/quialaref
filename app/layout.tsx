import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Qui a la réf ?",
  description: "Le quiz des références internet françaises — joue avec tes amis en temps réel !",
  openGraph: {
    title: "Qui a la réf ?",
    description: "Le quiz des références internet françaises",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen`}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
