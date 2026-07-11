# Deployment

## Static/runtime assets

`npm run assets` copies the PDF.js worker and Pyodide core files from pinned npm packages into `public/`. It runs automatically before development and production builds.

## Application

```bash
npm ci
npm run validate
npm run start
```

The project is configured for the bundled Sites/vinext Cloudflare runtime. `.openai/hosting.json` contains no required database or bucket binding. Configure provider secrets in the hosting environment, never in committed files.

## Office conversion

Run `docker compose up --build office-converter` separately and set `OFFICE_CONVERTER_URL` to its base URL. The app proxy appends `/convert`. If the service is absent, presentation UI shows an explicit fallback and preserves original download.

## Operational checks

Monitor provider latency/error class, renderer load failures, fallback rate, worker timeouts, conversion timeouts, and uploaded byte counts. CSP and cross-origin headers should be reviewed at the deployment edge if the host overrides application headers.
