import Link from "next/link";
import { enabledModules, productConfig } from "@/lib/product-config";

export default function HomePage() {
  return (
    <main className="product-shell">
      <nav className="product-nav" aria-label="Primary navigation">
        <Link className="wordmark" href="/">
          {productConfig.name}
        </Link>
        <div>
          <Link href="/blog">Notes</Link>
          <Link href="/privacy">Privacy</Link>
          {enabledModules.auth ? <Link href="/sign-in">Sign in</Link> : null}
        </div>
      </nav>

      <section className="product-hero">
        <div className="product-kicker">
          A focused product, built independently
        </div>
        <h1>{productConfig.description}</h1>
        <p>
          This is a deliberately minimal product surface. Replace this copy and
          visual system with the validated product’s own direction.
        </p>
        <div className="product-actions">
          <a href="#workflow">See the core workflow</a>
          {enabledModules.auth ? (
            <Link href="/sign-up">Create account</Link>
          ) : null}
        </div>
      </section>

      <section className="workflow-preview" id="workflow">
        <p>CORE WORKFLOW PLACEHOLDER</p>
        <h2>Build the one outcome customers will pay for.</h2>
        <div className="workflow-steps">
          <article>
            <span>01</span>
            <strong>Capture the input</strong>
          </article>
          <article>
            <span>02</span>
            <strong>Run the unique workflow</strong>
          </article>
          <article>
            <span>03</span>
            <strong>Deliver the result</strong>
          </article>
        </div>
      </section>

      <footer>
        <span>{productConfig.name}</span>
        <div>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </footer>
    </main>
  );
}
