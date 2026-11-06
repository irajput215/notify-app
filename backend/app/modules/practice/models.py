"""`tenant_settings`: a workspace's settings.

One row per workspace, created on first save. A missing row means the defaults (records kept 7 years)
and leaves the "Settings" setup step undone (fail closed). The forced RLS policy is created by the
baseline migration.
"""

import uuid
from datetime import UTC, datetime
from typing import Final

import sqlalchemy as sa
from sqlmodel import Field, SQLModel

MIN_RETENTION_YEARS: Final = 1
DEFAULT_RETENTION_YEARS: Final = 7

_TIMESTAMPTZ = sa.DateTime(timezone=True)


def _utcnow() -> datetime:
    return datetime.now(UTC)


class TenantSettings(SQLModel, table=True):
    __tablename__ = "tenant_settings"
    __table_args__ = (
        sa.CheckConstraint(
            f"retention_years >= {MIN_RETENTION_YEARS}",
            name="retention_years",
        ),
    )

    tenant_id: uuid.UUID = Field(
        foreign_key="tenants.id", primary_key=True, ondelete="RESTRICT"
    )
    retention_years: int = Field(default=DEFAULT_RETENTION_YEARS)
    updated_by: uuid.UUID = Field(foreign_key="user.id", ondelete="RESTRICT")
    updated_at: datetime = Field(default_factory=_utcnow, sa_type=_TIMESTAMPTZ)
