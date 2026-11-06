"""Response schemas for the locations module. No write routes exist yet."""

import uuid
from datetime import datetime

from sqlmodel import SQLModel

# PRIVATE API, deliberately, and the reason is the same as the patients schemas: SQLModel annotates
# `model_config` as `SQLModelConfig`, so a plain `ConfigDict` is rejected by both mypy --strict and ty.
from sqlmodel._compat import SQLModelConfig


class LocationRead(SQLModel):
    """A practice location as the API returns it.

    `from_attributes` lets the service hand over a declared model rather than a raw ORM entity
    (build-contract §6 control 5: no ORM entity is ever returned from a route).
    """

    model_config = SQLModelConfig(extra="forbid", from_attributes=True)

    id: uuid.UUID
    name: str
    address: str | None = None
    phone: str | None = None
    created_at: datetime
    updated_at: datetime


class LocationsPublic(SQLModel):
    """A bounded page of locations plus the caller's total, following `ContactsPublic`."""

    model_config = SQLModelConfig(extra="forbid")

    data: list[LocationRead]
    count: int
