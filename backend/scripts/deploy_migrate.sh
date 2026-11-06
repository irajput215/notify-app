#! /usr/bin/env bash
# The migration job (Cloud Run Job `notify-migrate`): schema, the API's login role, seed data.
# Runs as the schema owner for the first two steps and as the API's login for the seed.
set -euo pipefail

cd "$(dirname "$0")/.."
export PYTHONPATH=.

alembic upgrade head
python scripts/ensure_app_login.py
python app/initial_data.py
