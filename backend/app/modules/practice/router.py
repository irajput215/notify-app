"""Workspace settings and the setup checklist, under `/workspaces/current`.

Tenant from the session (INV-1); nothing here takes a tenant id.
"""

from fastapi import APIRouter, Depends

from app.api.deps import ActorDep
from app.core.rate_limit import admin_rate_limit, read_rate_limit
from app.modules.practice import service
from app.modules.practice.schemas import (
    PracticeSettingsRead,
    PracticeSettingsUpdate,
    SetupRead,
)
from app.modules.users_roles.catalog import TENANCY_PERMISSIONS
from app.modules.users_roles.service import authorize

router = APIRouter(prefix="/workspaces/current", tags=["workspaces"])

CONFIGURE = TENANCY_PERMISSIONS["configure"]
READ = TENANCY_PERMISSIONS["read"]


@router.get("/setup", response_model=SetupRead, dependencies=[Depends(read_rate_limit)])
def read_setup(*, actor: ActorDep) -> SetupRead:
    """The setup checklist for whoever configures the workspace (`workspace:configure`)."""
    authorize(actor, CONFIGURE)
    return service.setup(actor=actor)


@router.get(
    "/settings",
    response_model=PracticeSettingsRead,
    dependencies=[Depends(read_rate_limit)],
)
def read_settings(*, actor: ActorDep) -> PracticeSettingsRead:
    """The workspace settings (`workspace:read`); the defaults when none were saved."""
    authorize(actor, READ)
    return service.read_settings(actor=actor)


@router.patch(
    "/settings",
    response_model=PracticeSettingsRead,
    dependencies=[Depends(admin_rate_limit)],
)
def update_settings(
    *, actor: ActorDep, body: PracticeSettingsUpdate
) -> PracticeSettingsRead:
    """Save the workspace settings (`workspace:configure`).
    Audited `tenant.config_changed` with the names of the fields that changed."""
    authorize(actor, CONFIGURE)
    return service.update_settings(actor=actor, body=body)
