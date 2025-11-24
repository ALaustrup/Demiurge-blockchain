import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Demiurge — Sovereign Digital Pantheon",
  description: "A sovereign L1 and creator economy for Archons and Nomads.",
  manifest: "/manifest.json",
  themeColor: "#020617",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Demiurge",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="gradient-orbit min-h-screen antialiased">
        <ServiceWorkerRegistration />
        <div className="min-h-screen bg-slate-950/80">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  );
}
