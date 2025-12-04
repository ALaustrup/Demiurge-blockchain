import type { Metadata } from "next";
import "./globals.css";
import { NavbarWrapper } from "@/components/layout/NavbarWrapper";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { AudioContextProvider } from "@/lib/fracture/audio/AudioContextProvider";
import { AbyssIDProvider } from "@/lib/fracture/identity/AbyssIDContext";
import { RitualContextProvider } from "@/lib/rituals/RitualContextProvider";
import { ArchonContextProvider } from "@/lib/archon/ArchonContextProvider";
import { GenesisContextProvider } from "@/lib/genesis/GenesisContextProvider";
import { GENESIS_CONFIG } from "@/config/genesis";
import { OperatorContextProvider } from "@/lib/operator/OperatorContextProvider";
import { FabricServiceProvider } from "@/lib/fabric/FabricServiceSelector";
import { Bebas_Neue, Oswald, Rajdhani } from "next/font/google";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const oswald = Oswald({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
});

const rajdhani = Rajdhani({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-rajdhani",
  display: "swap",
});

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
    <html lang="en" className={`${bebasNeue.variable} ${oswald.variable} ${rajdhani.variable}`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="gradient-orbit min-h-screen antialiased">
        <ServiceWorkerRegistration />
        <AbyssIDProvider>
          <AudioContextProvider>
            <OperatorContextProvider>
              <FabricServiceProvider>
                <RitualContextProvider>
                  <ArchonContextProvider>
                    {GENESIS_CONFIG.enabled ? (
                      <GenesisContextProvider>
                        <NavbarWrapper>
                          {children}
                        </NavbarWrapper>
                      </GenesisContextProvider>
                    ) : (
                      <NavbarWrapper>
                        {children}
                      </NavbarWrapper>
                    )}
                  </ArchonContextProvider>
                </RitualContextProvider>
              </FabricServiceProvider>
            </OperatorContextProvider>
          </AudioContextProvider>
        </AbyssIDProvider>
      </body>
    </html>
  );
}
