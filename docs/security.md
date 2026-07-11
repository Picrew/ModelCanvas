# Security model

ModelCanvas assumes model and tool output is untrusted.

- JSON is bounded by bytes, depth, and node count before schema work.
- Known envelopes use strict schemas; unknown types receive a limited empty payload and fallback only.
- URLs reject JavaScript schemes, insecure remote HTTP, unsafe data MIME types, and non-allow-listed origins.
- Markdown and SVG pass through sanitization. Mermaid uses strict mode with HTML labels disabled.
- ECharts accepts data-only options and removes prototype keys/functions.
- HTML artifacts use `sandbox="allow-scripts"`, no same-origin, a restrictive CSP, and explicit origin policy.
- React dependencies are allow-listed. Python is executed in a terminable Worker. WebGL, waveform, PDF, EPUB, and object URLs are disposed on unmount.
- Uploads are limited to 25 MB and checked by extension/MIME. Provider secrets are server-only.
- Calendar, email, and dynamic form actions require review/confirmation and emit local host events in fixture mode.

The optional converter runs as a non-root, capability-dropped, read-only Docker service with bounded uploads, subprocess timeout, isolated temporary profiles, and cleanup.

Report security issues privately as described in the root `SECURITY.md`.
