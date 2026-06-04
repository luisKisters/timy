import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SwRegister } from "@/components/sw-register";
import { ScrollLock } from "@/components/scroll-lock";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Timy",
  description: "Find the perfect time to meet",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Timy" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ height: "100%", overflow: "hidden" }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          height: "100%",
          overflow: "hidden",
          margin: 0,
          touchAction: "none",
          background: "var(--bg)",
        }}
      >
        <SwRegister />
        <ScrollLock />
        {children}
      </body>
    </html>
  );
}
