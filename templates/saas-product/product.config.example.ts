export const productBlueprint = {
  name: "Replace with the product name",
  slug: "replace-with-product-slug",
  description: "Describe one focused customer outcome.",
  modules: {
    authentication: true,
    billing: false,
    email: false,
    analytics: false,
  },
  billing: {
    provider: "stripe",
    plans: [],
  },
} as const;

// A real product fills in its own plans only after validation. Example shape:
// { key: "pro", priceId: "price_...", entitlements: { projects: 10 } }
