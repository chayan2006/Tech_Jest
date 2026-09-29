# Architecture decisions

## ADR-0001 — Phase 0 defaults and implementation gate

- Context: The project values in the supplied specification are mostly blank, and the specification requires a plan before code.
- Options: Guess silently; stop entirely; propose explicit defaults and gate implementation on approval.
- Decision: Use explicit `TODO(owner)` defaults documented in `docs/PROGRESS.md`; do not scaffold until the product owner replies `go`.
- Consequences: The plan is actionable without inventing business facts, but implementation waits for approval.

## ADR-0002 — Email-only lead repository initially

- Context: No database choice or credentials are supplied, and the primary goal is reliable lead delivery.
- Options: Add Supabase/Prisma immediately; use email-only behind a repository interface; store leads in an unconfigured local file.
- Decision: Start with email-only and a repository interface. Add a database only after an explicit product decision.
- Consequences: Lower operational cost and fewer privacy obligations in early phases; production persistence can be added without changing form components.

## ADR-0003 — Static report-only CSP first

- Context: A nonce CSP can force dynamic rendering and affect the performance budget.
- Options: Nonce CSP immediately; static enforced CSP immediately; static report-only CSP followed by enforcement.
- Decision: Use a narrow static report-only CSP first, inspect violations, then enforce.
- Consequences: Preserves static rendering and provides an evidence-based path to enforcement; launch cannot be signed off until enforcement is clean.

## ADR-0004 — `@next/mdx` for blog content

- Context: The site needs three in-repo starter posts, build-time highlighting, and no CMS.
- Options: `@next/mdx`, a remote MDX loader, or a content framework.
- Decision: Use `@next/mdx` with the approved remark/rehype plugins.
- Consequences: Simple local authoring and static output; frontmatter/content validation must be implemented in the repository.
