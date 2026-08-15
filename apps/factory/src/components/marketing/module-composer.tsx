"use client";

import { useMemo, useState } from "react";

import styles from "./module-composer.module.css";

type ModuleId = "auth" | "billing" | "email" | "analytics" | "jobs" | "storage";

type ForgeModule = {
  id: ModuleId;
  name: string;
  description: string;
  paths: readonly string[];
  requiresAuth?: boolean;
};

const modules: readonly ForgeModule[] = [
  {
    id: "auth",
    name: "Identity",
    description: "Sessions, workspaces, and server-enforced authorization.",
    paths: ["apps/web/src/lib/auth.ts", "packages/auth/src/index.ts"],
  },
  {
    id: "billing",
    name: "Billing",
    description: "Signed webhooks, plans, and entitlement boundaries.",
    paths: [
      "apps/web/src/app/api/billing/webhook/route.ts",
      "packages/billing/src/entitlements.ts",
    ],
    requiresAuth: true,
  },
  {
    id: "email",
    name: "Email",
    description: "Validated sending with provider-safe message contracts.",
    paths: ["apps/web/src/lib/email.ts", "packages/email/src/index.ts"],
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Product events behind a replaceable provider boundary.",
    paths: ["apps/web/src/lib/analytics.ts", "packages/analytics/src/index.ts"],
  },
  {
    id: "jobs",
    name: "Jobs",
    description: "Retryable background work scoped to the right workspace.",
    paths: [
      "apps/web/src/app/api/inngest/route.ts",
      "packages/jobs/src/index.ts",
    ],
    requiresAuth: true,
  },
  {
    id: "storage",
    name: "Storage",
    description: "Tenant-owned files, signed access, and explicit ownership.",
    paths: [
      "apps/web/src/app/api/storage/upload/route.ts",
      "packages/storage/src/index.ts",
    ],
    requiresAuth: true,
  },
];

const moduleById = new Map(modules.map((module) => [module.id, module]));

const basePaths = [
  "apps/web/package.json",
  "apps/web/src/app/page.tsx",
  "apps/web/.env.example",
  "docs/deployment.md",
  "scripts/doctor.mjs",
] as const;

function getModule(id: ModuleId): ForgeModule {
  const definition = moduleById.get(id);

  if (!definition) {
    throw new Error(`Unknown SaaSForge module: ${id}`);
  }

  return definition;
}

export function ModuleComposer() {
  const [selected, setSelected] = useState<ReadonlySet<ModuleId>>(
    () => new Set<ModuleId>(["auth"]),
  );
  const [announcement, setAnnouncement] = useState(
    "Identity is selected. Choose the foundations for this product.",
  );

  const authIsRequired = modules.some(
    (module) => module.requiresAuth && selected.has(module.id),
  );

  const selectedModules = useMemo(
    () => modules.filter((module) => selected.has(module.id)),
    [selected],
  );

  const repositoryPaths = useMemo(
    () => [
      ...basePaths,
      ...selectedModules.flatMap((module) => module.paths),
      "tooling/security/license-check.mjs",
    ],
    [selectedModules],
  );

  const command = useMemo(() => {
    const moduleList = selectedModules.map((module) => module.id).join(",");

    return `pnpm forge:create -- --name "next-product" --modules "${moduleList}"`;
  }, [selectedModules]);

  function toggleModule(id: ModuleId) {
    const definition = getModule(id);
    const isSelected = selected.has(id);

    if (id === "auth" && authIsRequired) {
      setAnnouncement(
        "Identity stays selected because Billing, Jobs, or Storage needs workspace-scoped authorization.",
      );
      return;
    }

    setSelected((current) => {
      const next = new Set(current);

      if (isSelected) {
        next.delete(id);
      } else {
        next.add(id);

        if (definition.requiresAuth) {
          next.add("auth");
        }
      }

      return next;
    });

    if (!isSelected && definition.requiresAuth) {
      setAnnouncement(
        `${definition.name} and its required Identity foundation were added to the blueprint.`,
      );
      return;
    }

    setAnnouncement(
      `${definition.name} ${isSelected ? "removed from" : "added to"} the blueprint.`,
    );
  }

  return (
    <div aria-label="Interactive product blueprint" className={styles.composer}>
      <div className={styles.workspace}>
        <fieldset className={styles.selector}>
          <legend>Choose SaaS foundations</legend>
          <p className={styles.selectorHint} id="module-composer-hint">
            Billing, Jobs, and Storage add Identity automatically to keep tenant
            boundaries explicit.
          </p>
          <div className={styles.moduleList}>
            {modules.map((module, index) => {
              const isSelected = selected.has(module.id);
              const isLocked = module.id === "auth" && authIsRequired;
              const status = isLocked
                ? "Required"
                : isSelected
                  ? "Selected"
                  : "Add module";

              return (
                <button
                  aria-describedby={
                    module.requiresAuth ? "module-composer-hint" : undefined
                  }
                  aria-pressed={isSelected}
                  className={`${styles.moduleButton} ${
                    isSelected ? styles.moduleButtonSelected : ""
                  }`}
                  key={module.id}
                  onClick={() => toggleModule(module.id)}
                  type="button"
                >
                  <span aria-hidden="true" className={styles.moduleIndex}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.moduleCopy}>
                    <strong>{module.name}</strong>
                    <span>{module.description}</span>
                  </span>
                  <span className={styles.moduleStatus}>{status}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className={styles.output}>
          <div aria-live="polite" className={styles.srOnly}>
            {announcement}
          </div>
          <div className={styles.window}>
            <div className={styles.windowBar}>
              <span aria-hidden="true" className={styles.windowDots}>
                <i />
                <i />
                <i />
              </span>
              <span>next-product / repository tree</span>
              <span>{selectedModules.length} modules</span>
            </div>
            <div
              className={styles.repository}
              aria-label="Generated repository tree"
            >
              <div className={styles.repoRoot}>
                <span aria-hidden="true">◇</span>
                next-product/
              </div>
              <ul>
                {repositoryPaths.map((path) => (
                  <li key={path}>
                    <span aria-hidden="true">
                      {path.endsWith("/") ? "└" : "·"}
                    </span>
                    {path}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.commandBlock}>
            <div>
              <span>FORGE COMMAND</span>
              <strong>{selectedModules.length} selected</strong>
            </div>
            <code>
              <span aria-hidden="true">$ </span>
              {command}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
