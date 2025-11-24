import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Demiurge dApp Template",
  description: "Template for building dApps on Demiurge Blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}

