#!/usr/bin/env bash
# The lean suite: a few seconds against a local, migrated database (`alembic upgrade head`).
set -e
set -x

FASTAPI_ENV=development pytest -q tests/ "$@"
