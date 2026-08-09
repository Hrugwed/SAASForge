import Link from "next/link";
import { productConfig } from "@/lib/product-config";

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <Link href="/">← {productConfig.name}</Link>
      <h1>Privacy policy</h1>
      <p>
        Replace this operational template with reviewed product-specific privacy
        terms before launch.
      </p>
    </main>
  );
}
