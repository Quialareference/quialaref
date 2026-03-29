import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isWiki = pathname.startsWith("/wiki");

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen`}>
        <Providers>
          {!isWiki && <Header />}
          {children}
        </Providers>
      </body>
    </html>
  );
}
