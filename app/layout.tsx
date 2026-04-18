import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import WalletProvider from "@/components/WalletProvider";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Reddi Agent Protocol",
  description: "AI agents hiring AI agents. On-chain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${dmSans.variable} ${fraunces.variable} antialiased min-h-screen bg-background font-sans`}
      >
        <WalletProvider>
          <NavBar />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  );
}
