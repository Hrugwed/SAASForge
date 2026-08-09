import type { Metadata } from "next";
import { productConfig } from "@/lib/product-config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(productConfig.url),
  title: {
    default: productConfig.name,
    template: `%s · ${productConfig.name}`,
  },
  description: productConfig.description,
  applicationName: productConfig.name,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
