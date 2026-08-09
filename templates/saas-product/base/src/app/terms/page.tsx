import Link from "next/link";
import { productConfig } from "@/lib/product-config";

export default function TermsPage() {
  return (
    <main className="legal-page">
      <Link href="/">← {productConfig.name}</Link>
      <h1>Terms of service</h1>
      <p>
        Replace this operational template with reviewed product-specific terms
        before accepting customers.
      </p>
    </main>
  );
}
