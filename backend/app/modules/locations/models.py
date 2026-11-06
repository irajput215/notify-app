"""The `locations` table: a workspace's sites (a clinic's rooms, a business's branches).

Tenant-scoped child of `tenants`: `tenant_id NOT NULL`, an `ON DELETE RESTRICT` foreign key, and
`UNIQUE (tenant_id, id)` so a child table can reference a location without being able to reference
another workspace's. The forced row-level security policy is created by the baseline migration.
`UNIQUE (tenant_id, name)` makes a rename onto an existing name a `422` rather than a `500`.
"""

import uuid
from datetime import UTC, datetime

import sqlalchemy as sa
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(UTC)


# A shared TypeEngine instance: types are immutable, and `sa_type` wants an instance or a class,
# not a factory.
_TIMESTAMPTZ = sa.DateTime(timezone=True)


class Location(SQLModel, table=True):
    __tablename__ = "locations"
    __table_args__ = (
        # Named explicitly rather than left to the convention, which keys a unique constraint on its
        # first column alone and would collide with the primary key name.
        sa.UniqueConstraint("tenant_id", "id", name="uq_locations_tenant_id_id"),
        # R11/F7: a rename onto an existing name is refused, and the refusal is a constraint
        # violation the service maps to `422` rather than a `500`.
        sa.UniqueConstraint("tenant_id", "name", name="uq_locations_tenant_id_name"),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        sa_column_kwargs={"server_default": sa.text("gen_random_uuid()")},
    )
    # RESTRICT, not CASCADE or SET NULL: a practice location is part of the organisation's record.
    # Removing the organisation must fail loudly rather than delete its sites or leave them orphaned.
    tenant_id: uuid.UUID = Field(
        foreign_key="tenants.id", ondelete="RESTRICT", nullable=False
    )
    # The human-readable label US-02 creates and renames. `tenant_id` leads both unique constraints,
    # so `ORDER BY name` inside a tenant is served by `uq_locations_tenant_id_name` without a second
    # index.
    name: str = Field(max_length=255)
    address: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=64)
    created_at: datetime = Field(default_factory=_utcnow, sa_type=_TIMESTAMPTZ)
    updated_at: datetime = Field(
        default_factory=_utcnow,
        sa_type=_TIMESTAMPTZ,
        sa_column_kwargs={"onupdate": _utcnow},
    )
