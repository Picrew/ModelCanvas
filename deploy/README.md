# Self-hosted deployment

The production showcase is built with `NEXT_PUBLIC_BASE_PATH=/modelcanvas` and
runs from the Next.js standalone output on `127.0.0.1:3002`.

Required server-only environment variables:

- `NEXT_PUBLIC_BASE_PATH=/modelcanvas`
- `DEEPSEEK_API_KEY` set to the official DeepSeek API key
- `DEEPSEEK_MODEL=deepseek-v4-flash`
- `OPENAI_COMPATIBLE_BASE_URL=http://127.0.0.1:3001/v1`
- `OPENAI_COMPATIBLE_MODEL=Qwen/Qwen3-Coder-Next`
- `OPENAI_COMPATIBLE_API_KEY` set to the FreeLLMAPI unified proxy key
- `MODEL_RESPONSE_CACHE_DIR=/home/ubuntu/modelcanvas/shared/replay-cache`

Install `modelcanvas.service`, include `nginx-modelcanvas.conf` inside the HTTPS
server block, then validate Nginx before reloading it. API keys must remain in
`/home/ubuntu/modelcanvas/shared/modelcanvas.env` with mode `0600`.
