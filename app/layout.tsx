import type { Metadata } from "next";
import { Bebas_Neue, Space_Grotesk } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/app/components/CookieBanner";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas-neue",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "ZiggyHQ — CRM & Business Operations",
  description: "The CRM built for small businesses. Visual pipelines, email sequences, power dialer, team management, and automations — all in one place. 14-day free trial.",
  openGraph: {
    title: "ZiggyHQ — CRM & Business Operations",
    description: "The CRM built for small businesses. Visual pipelines, email sequences, power dialer, and automations. Start free for 14 days.",
    siteName: "ZiggyHQ",
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon-192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${spaceGrotesk.variable} h-full`}>
      <body className="h-full bg-background text-white antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
