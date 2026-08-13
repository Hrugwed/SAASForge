# Private object storage

Generated storage products use a product-owned private Cloudflare R2 bucket through its S3-compatible API. Browser code never receives provider credentials. Authenticated server routes derive the organization from the session, generate an organization-prefixed key, and return short-lived signed URLs.

The default upload policy permits PDF, common raster images, CSV, and plain text up to 10 MiB. SVG, HTML, scripts, executables, and unknown MIME types are rejected. Change the allowlist only for a documented product need. A client-declared MIME type is not proof of file contents: for security-sensitive workflows, process the uploaded object asynchronously, inspect magic bytes, malware-scan it, and mark it usable only after validation.

Upload URLs are valid for five minutes and bind the content type and declared length. Download routes verify that the requested key is inside the authenticated organization prefix. Deletion uses the same tenant boundary and must be invoked from a trusted application origin.

Before launch:

1. Disable public bucket access and create credentials scoped to this bucket only.
2. Configure CORS for the exact production and Preview origins and required upload headers.
3. Define retention, orphan cleanup, account deletion, and legal-hold behavior.
4. Exercise oversize, disallowed type, cross-tenant read/delete, expired signature, provider failure, and deletion flows.
5. Alert on signing errors, validation failures, provider errors, and unusual upload volume.
