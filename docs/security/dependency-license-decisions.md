# Dependency license decisions

The automated allowlist is intentionally narrow. Additions require recording the dependency, use, and reason here; this is engineering evidence, not legal advice.

## FSL-1.1-MIT

`@sentry/nextjs` installs Sentry CLI artifacts under FSL-1.1-MIT. SaaSForge uses them to upload application source maps to a product-owned Sentry project, not to offer a competing error-monitoring service. The license converts to MIT after its stated two-year period. Product owners must reassess this decision if their product competes with Sentry or their use changes.

`@bytecodealliance/preview2-shim` is distributed under Apache-2.0 with the LLVM exception. The exception relaxes Apache section 4 redistribution obligations for compiled object forms; it does not add a copyleft requirement. SaaSForge accepts it as a permissive transitive runtime dependency.

`argparse` is distributed under the OSI-approved Python-2.0 license. It is an unmodified transitive command-line dependency and does not impose a copyleft requirement. SaaSForge accepts it for that use.

## MIT OR CC0-1.0

Some transitive metadata/type packages offer a choice of MIT or CC0-1.0. Both options are permissive and already individually accepted by the project policy.
