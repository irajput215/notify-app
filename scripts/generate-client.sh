#! /usr/bin/env bash
# Regenerate the frontend's typed API client from the backend's OpenAPI document.
#
#   ./scripts/generate-client.sh
#
# Writes frontend/openapi.json and frontend/lib/api/schema.d.ts; `frontend/lib/api/client.ts` wraps
# them with openapi-fetch. Run it after any change to an API route or schema.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root/backend"
FASTAPI_ENV=development uv run python -c \
  "import app.main, json; print(json.dumps(app.main.app.openapi(), indent=2))" \
  > "$repo_root/frontend/openapi.json"
cd "$repo_root/frontend"
npx openapi-typescript openapi.json -o lib/api/schema.d.ts
