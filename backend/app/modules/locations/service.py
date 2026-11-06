"""Locations service facade: the only place `locations` is queried, always under the workspace's
RLS context (`tenant_transaction`) and with `tenant_id = :tenant_id` as a second line of defence.
"""

import uuid
from collections.abc import Sequence

from sqlmodel import col, func, select

from app.core.db import tenant_transaction
from app.modules.locations.models import Location
from app.modules.locations.schemas import LocationRead, LocationsPublic


def list_locations(*, tenant_id: uuid.UUID, limit: int) -> LocationsPublic:
    """The caller's locations, ordered by name then id, bounded by `limit`.

    `count` is the tenant's total, which the router's `limit` does not change.
    """
    with tenant_transaction(tenant_id=tenant_id) as session:
        scope = (Location.tenant_id == tenant_id,)
        count = session.exec(
            select(func.count()).select_from(Location).where(*scope)
        ).one()
        statement = (
            select(Location)
            .where(*scope)
            .order_by(col(Location.name), col(Location.id))
            .limit(limit)
        )
        locations: Sequence[Location] = session.exec(statement).all()
        return LocationsPublic(
            data=[LocationRead.model_validate(location) for location in locations],
            count=count,
        )


def get_location(
    *, tenant_id: uuid.UUID, location_id: uuid.UUID
) -> LocationRead | None:
    """One location for this tenant, or `None`.

    `None` is the only not-found answer: the caller cannot tell "another tenant's location" from "no
    such location", so a route answers `404` for both and never `403` (R9/F9 — a `403` would confirm the
    record exists across the tenant boundary).
    """
    with tenant_transaction(tenant_id=tenant_id) as session:
        statement = select(Location).where(
            Location.id == location_id,
            # Defence in depth, as above: RLS is the boundary, this predicate keeps the query scoped
            # for the connection role that currently bypasses the policy.
            Location.tenant_id == tenant_id,
        )
        location = session.exec(statement).first()
        if location is None:
            return None
        return LocationRead.model_validate(location)
