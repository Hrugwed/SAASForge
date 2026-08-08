import type { Metadata } from "next";
import { productConfig } from "@saasforge/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(productConfig.url),
  title: {
    default: productConfig.name,
    template: `%s · ${productConfig.name}`,
  },
  description: productConfig.description,
  applicationName: productConfig.name,
  robots: {
    index: true,
    follow: true,
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
