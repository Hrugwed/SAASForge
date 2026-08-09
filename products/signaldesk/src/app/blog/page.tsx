import Link from "next/link";
import { productConfig } from "@/lib/product-config";

export default function BlogPage() {
  return (
    <main className="legal-page">
      <Link href="/">← {productConfig.name}</Link>
      <h1>Product notes</h1>
      <p>
        No posts yet. Publish customer education, launch notes, and use-case
        content here.
      </p>
    </main>
  );
}
