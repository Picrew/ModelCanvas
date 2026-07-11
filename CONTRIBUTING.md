# Contributing

Use Node 24 and `npm ci`. Keep protocol changes backward-aware and include fixtures plus tests. Before opening a change, run `npm run typecheck`, `npm run lint -- --quiet`, `npm test`, the relevant Playwright project, and `npm run build`.

Do not weaken security schemas to make a fixture pass. New renderer engines require a license check, lazy loading, cleanup behavior, and an explicit trust boundary. Keep demo data deterministic and visibly labeled.
