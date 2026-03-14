import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RadiusCart - Local Marketplace",
  description: "Buy, sell, and rent items from people near you. Discover local deals in your neighborhood.",
  keywords: "marketplace, local, buy, sell, rent, nearby, community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
