"""The contacts HTTP API (`/api/v1/contacts`).

Every route follows the same request path: authenticate -> resolve the workspace from the session
(`get_actor`, INV-1) -> authorise through the central policy layer -> validate a strict body ->
execute inside the RLS-scoped transaction, audited on the same transaction. Another workspace's
contact is `404`, never `403`, so existence is not disclosed across a workspace boundary.

| Method and path | Permission | Audit |
| --- | --- | --- |
| `POST /contacts` | `contacts:manage` | `contact.create` |
| `GET /contacts?limit=&cursor=&status=` | `contacts:read` | `contact.read` (count only) |
| `POST /contacts/search` | `contacts:read` | `contact.read` (term kinds only) |
| `GET /contacts/{id}` | `contacts:read` | `contact.read` |
| `PATCH /contacts/{id}` | `contacts:manage` | `contact.update` (field names only) |
| `POST /contacts/{id}/opt-in` | `contacts:manage` | `contact.update` (`OPT_IN` / `OPT_OUT`) |
| `POST /contacts/{id}/status` | `contacts:manage` | `contact.update` (`STATUS_*`) |
"""

import uuid
from typing import Final, NoReturn

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.api.deps import ActorDep
from app.core.rate_limit import contact_search_rate_limit, read_rate_limit
from app.modules.contacts import service
from app.modules.contacts.schemas import (
    ContactCreate,
    ContactOptIn,
    ContactRead,
    ContactSearch,
    ContactsPublic,
    ContactStatus,
    ContactStatusChange,
    ContactUpdate,
)
from app.modules.users_roles.catalog import CONTACT_PERMISSIONS
from app.modules.users_roles.policy import Actor, can, enforce
from app.modules.users_roles.service import authorize

router = APIRouter(prefix="/contacts", tags=["contacts"])

MAX_PAGE_SIZE: Final = 100
MAX_CURSOR_LENGTH: Final = 200
# Search is a body, never a query string: an ignored `?q=` would answer with the unfiltered list and
# leave the term in the URL.
_LIST_QUERY_PARAMETERS: Final[frozenset[str]] = frozenset({"limit", "cursor", "status"})
UNSUPPORTED_QUERY_PARAMETER: Final = "UNSUPPORTED_QUERY_PARAMETER"
AUTHZ_DENIED: Final = "AUTHZ_DENIED"


def _not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found"
    )


def _unprocessable(code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail={"code": code, "message": message},
    )


def _refused(refused: service.ContactRefused) -> NoReturn:
    raise HTTPException(
        status_code=refused.status_code,
        detail={"code": refused.code, "message": refused.message},
    )


def _context(actor: Actor, request: Request) -> service.ReadContext:
    return service.ReadContext(
        actor_id=actor.user_id,
        actor_role=actor.actor_role,
        source_ip=None if request.client is None else request.client.host,
    )


def _authorise_read(actor: Actor, context: service.ReadContext) -> None:
    """`contacts:read`, with a refusal audited before it is raised."""
    decision = can(actor, CONTACT_PERMISSIONS["read"])
    if not decision.allowed:
        service.record_read_denial(
            tenant_id=actor.tenant_id, context=context, reason=AUTHZ_DENIED
        )
    enforce(decision)


def _invalid_cursor() -> HTTPException:
    return _unprocessable(
        service.INVALID_CURSOR,
        "The cursor is not valid for this request. Start again from the first page.",
    )


@router.post("", response_model=ContactRead, status_code=status.HTTP_201_CREATED)
def create_contact(*, actor: ActorDep, body: ContactCreate) -> ContactRead:
    """Create a contact in the caller's workspace. The workspace comes from the session."""
    authorize(actor, CONTACT_PERMISSIONS["manage"])
    try:
        return service.create_contact(actor=actor, body=body)
    except service.ContactRefused as refused:
        _refused(refused)


@router.get("", response_model=ContactsPublic)
def list_contacts(
    *,
    actor: ActorDep,
    request: Request,
    limit: int = Query(default=MAX_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    cursor: str | None = Query(default=None, max_length=MAX_CURSOR_LENGTH),
    status_filter: list[ContactStatus] | None = Query(default=None, alias="status"),
) -> ContactsPublic:
    """One keyset page of the workspace's contacts. Follow `next_cursor` for the next page."""
    context = _context(actor, request)
    _authorise_read(actor, context)
    if set(request.query_params) - _LIST_QUERY_PARAMETERS:
        service.record_read_denial(
            tenant_id=actor.tenant_id,
            context=context,
            reason=UNSUPPORTED_QUERY_PARAMETER,
        )
        raise _unprocessable(
            UNSUPPORTED_QUERY_PARAMETER,
            "This list takes only limit, cursor and status. Search with POST /api/v1/contacts/search.",
        )
    try:
        return service.list_contacts(
            tenant_id=actor.tenant_id,
            context=context,
            limit=limit,
            cursor=cursor,
            statuses=status_filter,
        )
    except service.InvalidCursor as error:
        raise _invalid_cursor() from error


@router.post(
    "/search",
    response_model=ContactsPublic,
    dependencies=[Depends(contact_search_rate_limit)],
)
def search_contacts(
    *, actor: ActorDep, request: Request, body: ContactSearch
) -> ContactsPublic:
    """Find contacts by name or email prefix, exact phone number, or `#tag`. Keyset-paged."""
    context = _context(actor, request)
    _authorise_read(actor, context)
    try:
        return service.search_contacts(
            tenant_id=actor.tenant_id,
            context=context,
            q=body.q,
            limit=body.limit,
            cursor=body.cursor,
        )
    except service.InvalidCursor as error:
        raise _invalid_cursor() from error


@router.get(
    "/{contact_id}", response_model=ContactRead, dependencies=[Depends(read_rate_limit)]
)
def read_contact(
    *, actor: ActorDep, request: Request, contact_id: uuid.UUID
) -> ContactRead:
    """One contact. Another workspace's contact is `404`."""
    context = _context(actor, request)
    _authorise_read(actor, context)
    found = service.read_contact(
        actor=actor, contact_id=contact_id, source_ip=context.source_ip
    )
    if found is None:
        raise _not_found()
    return found


@router.patch("/{contact_id}", response_model=ContactRead)
def update_contact(
    *, actor: ActorDep, contact_id: uuid.UUID, body: ContactUpdate
) -> ContactRead:
    """Change the fields sent; the rest are left alone."""
    authorize(actor, CONTACT_PERMISSIONS["manage"])
    try:
        updated = service.update_contact(actor=actor, contact_id=contact_id, body=body)
    except service.ContactRefused as refused:
        _refused(refused)
    if updated is None:
        raise _not_found()
    return updated


@router.post("/{contact_id}/opt-in", response_model=ContactRead)
def record_opt_in(
    *, actor: ActorDep, contact_id: uuid.UUID, body: ContactOptIn
) -> ContactRead:
    """Record a WhatsApp opt-in or opt-out, and how it was given."""
    authorize(actor, CONTACT_PERMISSIONS["manage"])
    updated = service.record_opt_in(actor=actor, contact_id=contact_id, body=body)
    if updated is None:
        raise _not_found()
    return updated


@router.post("/{contact_id}/status", response_model=ContactRead)
def change_contact_status(
    *, actor: ActorDep, contact_id: uuid.UUID, body: ContactStatusChange
) -> ContactRead:
    """Block (no new bookings), archive (leaves the list) or reactivate a contact."""
    authorize(actor, CONTACT_PERMISSIONS["manage"])
    updated = service.change_status(actor=actor, contact_id=contact_id, change=body)
    if updated is None:
        raise _not_found()
    return updated
