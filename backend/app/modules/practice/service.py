"""Workspace settings and the workspace setup checklist.

**No table for progress.** Every checklist step is computed from data that already exists, so the card
can never disagree with the workspace: the display name, the business hours row, the accounts and the
saved workspace settings.

The settings are stored and shown. Retention is not enforced yet (nothing is ever hard-deleted).
"""

import uuid
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime
from typing import Final

from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert
from sqlmodel import Session, select

from app.core.db import tenant_transaction
from app.modules.audit import service as audit
from app.modules.practice.models import (
    DEFAULT_RETENTION_YEARS,
    TenantSettings,
)
from app.modules.practice.schemas import (
    PracticeSettingsRead,
    PracticeSettingsUpdate,
    SetupRead,
    SetupStep,
    StepKey,
)
from app.modules.users_roles.policy import Actor

CONFIG_CHANGED: Final = "tenant.config_changed"


@contextmanager
def _transaction(actor: Actor) -> Iterator[Session]:
    with tenant_transaction(
        tenant_id=actor.tenant_id, actor_id=actor.user_id, actor_role=actor.actor_role
    ) as session:
        yield session


def _row(session: Session, tenant_id: uuid.UUID) -> TenantSettings | None:
    return session.exec(
        select(TenantSettings).where(TenantSettings.tenant_id == tenant_id)
    ).first()


def _read(row: TenantSettings | None) -> PracticeSettingsRead:
    if row is None:
        return PracticeSettingsRead(
            retention_years=DEFAULT_RETENTION_YEARS,
            updated_at=None,
        )
    return PracticeSettingsRead(
        retention_years=row.retention_years,
        updated_at=row.updated_at,
    )


def read_settings(*, actor: Actor) -> PracticeSettingsRead:
    with _transaction(actor) as session:
        return _read(_row(session, actor.tenant_id))


def update_settings(
    *, actor: Actor, body: PracticeSettingsUpdate
) -> PracticeSettingsRead:
    """Save the settings; audited `tenant.config_changed` with the names of what changed (R6)."""
    with _transaction(actor) as session:
        before = _read(_row(session, actor.tenant_id))
        changed = [
            name
            for name, old, new in (
                (
                    "retention_years",
                    before.retention_years,
                    body.retention_years,
                ),
            )
            if old != new
        ]
        now = datetime.now(UTC)
        values = {
            "retention_years": body.retention_years,
            "updated_by": actor.user_id,
            "updated_at": now,
        }
        session.exec(
            insert(TenantSettings)
            .values(tenant_id=actor.tenant_id, **values)
            .on_conflict_do_update(index_elements=["tenant_id"], set_=values)
        )
        audit.record(
            session,
            audit.AuditEvent(
                action=CONFIG_CHANGED,
                result="SUCCESS",
                resource_id=actor.tenant_id,
                payload={"changed_fields": changed, "step_up": False},
            ),
        )
        session.expire_all()
        return _read(_row(session, actor.tenant_id))


_FACTS = text(
    """
    SELECT
        (SELECT coalesce(nullif(trim(display_name), ''), '') <> '' FROM tenants WHERE id = :t),
        EXISTS (SELECT 1 FROM appointment_settings WHERE tenant_id = :t),
        (SELECT count(*) FROM "user" WHERE tenant_id = :t) > 1,
        EXISTS (SELECT 1 FROM tenant_settings WHERE tenant_id = :t)
    """
)


def setup(*, actor: Actor) -> SetupRead:
    """The checklist (R1-R3): each step from live data, never a stored tick."""
    with _transaction(actor) as session:
        name, hours, team, workflow = (
            session.connection().execute(_FACTS, {"t": actor.tenant_id}).one()
        )

    def required(key: StepKey, done: bool) -> SetupStep:
        return SetupStep(key=key, status="done" if done else "todo", required=True)

    steps = [
        required("workspace_name", bool(name)),
        required("hours", bool(hours)),
        required("team_invited", bool(team)),
        required("settings", bool(workflow)),
        SetupStep(key="permissions_reviewed", status="optional", required=False),
        SetupStep(key="booking_page", status="optional", required=False),
        # Connecting WhatsApp and a booking system arrives with the channels and connectors modules.
        SetupStep(key="integrations", status="informational", required=False),
    ]
    done = sum(1 for s in steps if s.required and s.status == "done")
    total = sum(1 for s in steps if s.required)
    return SetupRead(
        steps=steps, required_done=done, required_total=total, ready=done == total
    )
