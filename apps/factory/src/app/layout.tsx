import type { Metadata } from "next";
import { factoryConfig } from "@/lib/factory-config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(factoryConfig.url),
  title: {
    default: factoryConfig.name,
    template: `%s · ${factoryConfig.name}`,
  },
  description: factoryConfig.description,
  applicationName: factoryConfig.name,
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
