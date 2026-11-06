"""The workspace HTTP API: `/api/v1/workspaces/current` and step-up.

Internally a workspace is a *tenant* (the `tenants` table, `tenant_id` columns and the
`app.tenant_id` RLS setting); the API speaks of workspaces.

**The workspace is resolved, never supplied (INV-1).** The actor is built by `app.api.deps.get_actor`
from the session row and nothing else. Nothing here reads a tenant identifier from a path, body, query
string or header: the path is literally `/current`, and the update schemas forbid unknown fields.

| Method and path | Permission | Audit |
| --- | --- | --- |
| `GET /workspaces/current` | `workspace:read` | none |
| `PATCH /workspaces/current` | `workspace:configure` + step-up | refused until a security setting exists |
| `GET /workspaces/current/profile` | any member | none (public display name) |
| `PATCH /workspaces/current/profile` | `workspace:configure` | `tenant.config_changed` |
| `POST /auth/step-up` | session | `auth.step_up` / `auth.step_up_failed` |

Cross-workspace access is `404`, never `403`.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.api.deps import ActorDep
from app.core.db import tenant_transaction
from app.core.rate_limit import admin_rate_limit, read_rate_limit, step_up_rate_limit
from app.modules.identity_tenancy import service as identity_service
from app.modules.identity_tenancy.models import Tenant
from app.modules.identity_tenancy.schemas import (
    StepUpGrantRead,
    StepUpRequest,
    TenantCurrentRead,
    TenantProfileRead,
    TenantProfileUpdate,
    TenantSettingsUpdate,
)
from app.modules.users_roles.catalog import TENANCY_PERMISSIONS
from app.modules.users_roles.service import authorize, can, enforce

# A change under `/api/v1/workspaces/*` is the administrative class (20/min); a single-resource read
# is the read class (300/min). Each route declares its class as a route dependency, which runs
# before the endpoint's own authentication and authorisation, so an unauthenticated flood is bounded
# on both.
router = APIRouter(prefix="/workspaces", tags=["workspaces"])

# The refusal for a security-setting change without a step-up grant.
STEP_UP_REQUIRED = "STEP_UP_REQUIRED"

_NOT_FOUND = "NOT_FOUND"


def _tenant_not_found() -> HTTPException:
    """One answer for an absent tenant row, with a stable code and no internal detail."""
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": _NOT_FOUND, "message": "Tenant not found"},
    )


def _current_tenant(*, tenant_id: uuid.UUID) -> TenantCurrentRead | None:
    """The caller's own tenant row, selecting only the columns `clinos_app` may read.

    The query is column-limited on purpose. `03-design.md` "Database privileges" grants the application
    role `SELECT (id, slug, status, data_region)` on `tenants` and withholds `retention_profile` and
    `legal_name`; loading the ORM entity would select every column and would fail with `permission
    denied for column` the day the application connects as `clinos_app` instead of as the table owner.

    `tenants` is global (no RLS), so the explicit `id` predicate is the whole scope; the tenant-scoped
    transaction is still used, because the rule is "every query against tenant data goes through the
    helper" and because it fails closed with no context.
    """
    with tenant_transaction(tenant_id=tenant_id) as session:
        # The statement names its six columns explicitly, through the table rather than the model's
        # class attributes: SQLModel types a class attribute as its *declared* type (`uuid.UUID`), so
        # `select(Tenant.id, ...)` is not a typed column select, and `load_only` needs mapped
        # attributes rather than names. Naming the columns is the control, not a detail — the
        # application role holds `SELECT` on exactly these, and an ORM entity select would ask for
        # `retention_profile` and `legal_name` too and fail with `permission denied for column` the
        # day the application connects as `clinos_app` instead of as the table owner.
        # `Tenant.metadata.tables` rather than `Tenant.__table__`: SQLModel's base class does not
        # declare `__table__` in its type stubs, while `metadata` is declared, so this is the spelling
        # that type-checks and still yields the same `Table`.
        table = Tenant.metadata.tables["tenants"]
        statement = select(
            table.c.id,
            table.c.slug,
            table.c.status,
            table.c.data_region,
            table.c.created_at,
            table.c.updated_at,
        ).where(table.c.id == tenant_id)
        # `connection().execute`, not `session.exec`: `session.exec` is typed for a single-entity
        # scalar select (`Select[_TSelectParam]`), `session.execute` is the shim SQLModel deprecates,
        # and a Core select executed on the session's connection is the same transaction without
        # either caveat — `app/core/db.py` uses the connection the same way.
        row = session.connection().execute(statement).one_or_none()
        if row is None:
            return None
        return TenantCurrentRead(
            id=row[0],
            slug=row[1],
            status=row[2],
            data_region=row[3],
            created_at=row[4],
            updated_at=row[5],
        )


@router.get(
    "/current",
    response_model=TenantCurrentRead,
    dependencies=[Depends(read_rate_limit)],
)
def read_current_tenant(*, actor: ActorDep) -> TenantCurrentRead:
    """Return the caller's own tenant. `retention_profile` is never part of the answer (US-1)."""
    authorize(actor, TENANCY_PERMISSIONS["read"])
    tenant = _current_tenant(tenant_id=actor.tenant_id)
    if tenant is None:
        raise _tenant_not_found()
    return tenant


@router.patch(
    "/current",
    dependencies=[Depends(admin_rate_limit)],
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": (
                "Refused. `PERMISSION_NOT_HELD` when the caller does not hold `tenant:configure`; "
                "`STEP_UP_REQUIRED` for a caller who does, because the step-up control this route "
                "requires is not built (feature 02, blocked by D-003). Nothing is written."
            )
        }
    },
)
def update_current_tenant(
    *, actor: ActorDep, _settings_in: TenantSettingsUpdate
) -> None:
    """Refuse a tenant security-setting change: the required step-up control is not built (R12).

    The body has already been validated by the time this runs — `TenantSettingsUpdate` declares no
    field and forbids extras, so a body `tenant_id` or any other name is a `422` from the validation
    layer and never reaches this function. What remains is the authorisation decision and the refusal
    that the missing step-up forces; the declaration on this module records why no success path exists
    and what the writer must emit when it does.
    """
    authorize(actor, TENANCY_PERMISSIONS["configure"])
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "code": STEP_UP_REQUIRED,
            "message": (
                "Changing a tenant security setting requires a fresh step-up, which is not "
                "available yet; nothing was changed."
            ),
        },
    )


@router.get(
    "/current/profile",
    response_model=TenantProfileRead,
    dependencies=[Depends(read_rate_limit)],
)
def read_current_tenant_profile(*, actor: ActorDep) -> TenantProfileRead:
    """The caller's own clinic's display name, for every member of it.

    No permission code: the display name is PUBLIC (the booking page shows it to anyone), and the
    route answers only for the session's own organisation. An account with no organisation, or one
    whose organisation is not active, is refused by `get_actor` before this runs.
    """
    profile = identity_service.tenant_profile(tenant_id=actor.tenant_id)
    if profile is None:
        raise _tenant_not_found()
    return profile


@router.patch(
    "/current/profile",
    response_model=TenantProfileRead,
    dependencies=[Depends(admin_rate_limit)],
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": "`PERMISSION_NOT_HELD`: renaming the clinic needs `tenant:configure`. "
            "Audited `tenant.config_changed` `DENIED`; nothing is changed."
        }
    },
)
def update_current_tenant_profile(
    *, actor: ActorDep, body: TenantProfileUpdate
) -> TenantProfileRead:
    """Rename the caller's own clinic (Practice Owner). Audited on the same transaction.

    The body is validated first (a blank, over-long or unprintable name is a `422`), then the
    permission is decided; a refusal is audited before it is raised.
    """
    decision = can(actor, TENANCY_PERMISSIONS["configure"])
    if not decision.allowed:
        identity_service.record_display_name_denial(
            tenant_id=actor.tenant_id,
            actor_id=actor.user_id,
            actor_role=actor.actor_role,
            reason=decision.code.value,
        )
        enforce(decision)
    return identity_service.update_display_name(
        tenant_id=actor.tenant_id,
        actor_id=actor.user_id,
        actor_role=actor.actor_role,
        display_name=body.display_name,
        client_tenant_id_supplied=body.client_tenant_id_supplied,
    )


# `/api/v1/auth/*` belongs to this module (`docs/reference/build-contract.md` §7).
auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post(
    "/step-up",
    response_model=StepUpGrantRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(step_up_rate_limit)],
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": "`STEP_UP_FAILED`: the password did not verify. Audited; nothing issued."
        }
    },
)
def step_up(*, actor: ActorDep, body: StepUpRequest) -> StepUpGrantRead:
    """Re-prove the factor (interim: the password, ADR-F002) for one operation on one resource.

    `docs/features/02-authentication/03-design.md` names this route (`POST /api/v1/auth/step-up`,
    *"issue a single-use resource-bound step-up token"*). The grant lives two minutes, is bound to this
    account, the operation and the resource id, and is spent by the operation's own transaction. No
    permission is checked here: the grant authorises nothing by itself, and the operation that spends
    it checks its own permission first. A wrong password answers `403`, never `401`, so the client
    does not sign the clinician out for a typo.
    """
    grant = identity_service.issue_step_up(
        tenant_id=actor.tenant_id,
        user_id=actor.user_id,
        actor_role=actor.actor_role,
        password=body.password,
        operation=body.operation,
        resource_id=body.resource_id,
    )
    if grant is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": identity_service.STEP_UP_FAILED,
                "message": "That password isn't right.",
            },
        )
    return grant
