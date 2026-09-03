"use client";

import { useState } from "react";

import {
  modulesRequiringAuth,
  supportedModules,
} from "@saasforge/forge-cli/product-blueprint";
import type { ProductModule } from "@saasforge/forge-cli/product-blueprint";
import {
  buildBlueprintExport,
  slugifyProductName,
  toggleProductModule,
} from "@/lib/blueprint-composer";
import { CopyCommand } from "./copy-command";
import styles from "./blueprint-composer.module.css";

const moduleDetails: Record<
  ProductModule,
  { name: string; description: string }
> = {
  auth: {
    name: "Identity",
    description: "Sessions, organizations, and tenant authorization.",
  },
  billing: {
    name: "Billing",
    description: "Checkout, signed webhooks, and entitlements.",
  },
  email: {
    name: "Email",
    description: "Transactional messages behind a provider adapter.",
  },
  analytics: {
    name: "Analytics",
    description: "Consent-aware events with a replaceable provider.",
  },
  jobs: {
    name: "Jobs",
    description: "Durable background work with tenant context.",
  },
  storage: {
    name: "Storage",
    description: "Private files, signed access, and ownership checks.",
  },
};

const initialDraft = {
  name: "Signal Desk",
  slug: "signal-desk",
  description: "Turn noisy customer feedback into clear product priorities.",
  modules: ["auth", "analytics"] as ProductModule[],
};

export function BlueprintComposer() {
  const [draft, setDraft] = useState(initialDraft);
  const [slugWasEdited, setSlugWasEdited] = useState(false);
  const output = buildBlueprintExport(draft);
  const authIsRequired = modulesRequiringAuth.some((moduleName) =>
    draft.modules.includes(moduleName),
  );

  function fieldError(field: "name" | "slug" | "description" | "modules") {
    if (output.valid) return undefined;
    return output.errors[field]?.[0];
  }

  function updateName(name: string) {
    setDraft((current) => ({
      ...current,
      name,
      slug: slugWasEdited ? current.slug : slugifyProductName(name),
    }));
  }

  function toggleModule(moduleName: ProductModule) {
    setDraft((current) => ({
      ...current,
      modules: toggleProductModule(current.modules, moduleName),
    }));
  }

  function downloadBlueprint() {
    if (!output.valid) return;
    const url = URL.createObjectURL(
      new Blob([output.json], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${output.document.product.slug}.saasforge-blueprint.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <section
      aria-label="Product blueprint composer"
      className={styles.composer}
      id="blueprint-composer"
    >
      <header className={styles.header}>
        <div>
          <span>BLUEPRINT COMPOSER</span>
          <h2>Draft the repository boundary.</h2>
          <p>
            Validate product inputs here, then export them. Generation still
            happens explicitly in your terminal.
          </p>
        </div>
        <strong>READ ONLY</strong>
      </header>

      <div className={styles.workspace}>
        <div className={styles.formPanel}>
          <div className={styles.identityFields}>
            <label>
              <span>Product name</span>
              <input
                aria-describedby={fieldError("name") ? "name-error" : undefined}
                maxLength={60}
                onChange={(event) => updateName(event.currentTarget.value)}
                value={draft.name}
              />
              {fieldError("name") ? (
                <small id="name-error">{fieldError("name")}</small>
              ) : null}
            </label>
            <label>
              <span>Repository slug</span>
              <input
                aria-describedby={fieldError("slug") ? "slug-error" : undefined}
                maxLength={40}
                onChange={(event) => {
                  setSlugWasEdited(true);
                  setDraft((current) => ({
                    ...current,
                    slug: event.currentTarget.value,
                  }));
                }}
                spellCheck={false}
                value={draft.slug}
              />
              {fieldError("slug") ? (
                <small id="slug-error">{fieldError("slug")}</small>
              ) : null}
            </label>
          </div>

          <label className={styles.outcomeField}>
            <span>Customer outcome</span>
            <textarea
              aria-describedby={
                fieldError("description") ? "description-error" : undefined
              }
              maxLength={180}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.currentTarget.value,
                }))
              }
              rows={3}
              value={draft.description}
            />
            <i>{draft.description.length} / 180</i>
            {fieldError("description") ? (
              <small id="description-error">{fieldError("description")}</small>
            ) : null}
          </label>

          <div className={styles.mode}>
            <span>Deployment mode</span>
            <strong>Standalone repository</strong>
            <small>
              Independent data, credentials, domain, and deployment.
            </small>
          </div>

          <fieldset className={styles.modules}>
            <legend>Capabilities</legend>
            <p id="module-dependency-note">
              Billing, Jobs, and Storage require Identity for tenant ownership.
            </p>
            <div className={styles.moduleGrid}>
              {supportedModules.map((moduleName) => {
                const selected = draft.modules.includes(moduleName);
                const locked = moduleName === "auth" && authIsRequired;
                const detail = moduleDetails[moduleName];
                return (
                  <label
                    className={selected ? styles.moduleSelected : undefined}
                    key={moduleName}
                  >
                    <input
                      aria-describedby={
                        modulesRequiringAuth.some(
                          (candidate) => candidate === moduleName,
                        )
                          ? "module-dependency-note"
                          : undefined
                      }
                      checked={selected}
                      disabled={locked}
                      onChange={() => toggleModule(moduleName)}
                      type="checkbox"
                    />
                    <span>
                      <strong>{detail.name}</strong>
                      <small>{detail.description}</small>
                    </span>
                    <i>{locked ? "Required" : selected ? "On" : "Off"}</i>
                  </label>
                );
              })}
            </div>
            {fieldError("modules") ? (
              <small className={styles.moduleError}>
                {fieldError("modules")}
              </small>
            ) : null}
          </fieldset>
        </div>

        <div className={styles.outputPanel}>
          <div className={styles.outputStatus}>
            <span>EXPORT PREVIEW</span>
            <strong data-valid={output.valid}>
              {output.valid ? "VALIDATED" : "DRAFT INCOMPLETE"}
            </strong>
          </div>

          {output.valid ? (
            <>
              <div className={styles.packageClosure}>
                <span>Resolved package closure</span>
                <ul>
                  {output.packages.map((packageName) => (
                    <li key={packageName}>{packageName}</li>
                  ))}
                </ul>
              </div>
              <pre aria-label="Blueprint JSON preview">{output.json}</pre>
              <div className={styles.exportActions}>
                <CopyCommand
                  command={output.command}
                  label="Encoded CLI command"
                />
                <button onClick={downloadBlueprint} type="button">
                  DOWNLOAD JSON
                </button>
              </div>
            </>
          ) : (
            <div aria-live="polite" className={styles.invalidOutput}>
              <strong>Complete the highlighted blueprint fields.</strong>
              <p>
                No command or configuration is exported until validation passes.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
