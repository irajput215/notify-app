"""Contacts service facade: the only place `contacts` is queried.

- **Every query runs inside `app.core.db.tenant_transaction(...)`**, which sets `app.tenant_id` for the
  transaction and so activates the forced row-level security policy. Every query also carries
  `tenant_id = :tenant_id` as a second line of defence.
- **Nothing returns an ORM entity.** Rows become `ContactRead` inside the transaction.
- **Every write and every read is audited on the same transaction (INV-4)**: a create or update carries
  field *names*, never values; a list or search carries the result count and the *kinds* of term, never
  the term.
- **List and search are keyset-paged** on `(family_name, given_name, id)` with a signed cursor that
  names a row, bound to the workspace and the request's scope.

Search terms: a phone number (exact, through the blind index), `#tag` (exact tag), or a
case-insensitive prefix of the given name, family name or email. Every term must match.
"""

import base64
import hashlib
import hmac
import uuid
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Final

from sqlalchemy import ColumnElement, literal, or_, tuple_
from sqlmodel import Session, col, func, select

from app.core import field_crypto
from app.core.config import settings
from app.core.db import tenant_transaction
from app.core.reads import Pending, ReadBatch
from app.modules.audit import service as audit
from app.modules.contacts import phone as phones
from app.modules.contacts.models import (
    CONTACT_STATUSES,
    DEFAULT_TIMEZONE,
    INACTIVE_STATUSES,
    PHONE_KIND,
    Contact,
)
from app.modules.contacts.schemas import (
    ContactCreate,
    ContactOptIn,
    ContactRead,
    ContactsPublic,
    ContactStatusChange,
    ContactUpdate,
)
from app.modules.users_roles.policy import Actor

CONTACT_CREATE: Final = "contact.create"
CONTACT_UPDATE: Final = "contact.update"
CONTACT_READ: Final = "contact.read"
INVALID_CURSOR: Final = "INVALID_CURSOR"
NOT_FOUND: Final = "AUTHZ_DENIED_CROSS_TENANT"
PHONE_INVALID: Final = "PHONE_INVALID"
PHONE_TAKEN: Final = "PHONE_TAKEN"


class InvalidCursor(ValueError):
    """The cursor is malformed, forged, or issued for another request. Never echoes it."""


class ContactRefused(Exception):
    """A write the service refuses, with a closed code for the `{code, message}` envelope."""

    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


@dataclass(frozen=True)
class ReadContext:
    actor_id: uuid.UUID
    actor_role: str | None = None
    source_ip: str | None = None


def display_name(given_name: str, family_name: str) -> str:
    return f"{given_name} {family_name}".strip()


def to_read(contact: Contact) -> ContactRead:
    return ContactRead(
        id=contact.id,
        given_name=contact.given_name,
        family_name=contact.family_name,
        display_name=display_name(contact.given_name, contact.family_name),
        email=contact.email,
        phone=field_crypto.decrypt(
            contact.phone_e164, tenant_id=contact.tenant_id, kind=PHONE_KIND
        ),
        whatsapp_opt_in=contact.whatsapp_opt_in,
        opt_in_at=contact.opt_in_at,
        opt_in_source=contact.opt_in_source,
        receives_communications=contact.receives_communications,
        tags=list(contact.tags),
        external_ids=dict(contact.external_ids),
        status=contact.status,  # type: ignore[arg-type]
        timezone=contact.timezone,
        created_at=contact.created_at,
        updated_at=contact.updated_at,
    )


def phone_index(value: str, *, tenant_id: uuid.UUID) -> bytes:
    """The blind index of an already-normalised E.164 number."""
    return field_crypto.blind_index(value, tenant_id=tenant_id, kind=PHONE_KIND)


def _set_phone(contact: Contact, raw: str | None, *, tenant_id: uuid.UUID) -> None:
    if raw is None or not raw.strip():
        contact.phone_e164 = None
        contact.phone_blind_index = None
        return
    try:
        number = phones.normalise(raw)
    except phones.InvalidPhoneNumber:
        raise ContactRefused(422, PHONE_INVALID, "That phone number isn't valid.")
    contact.phone_e164 = field_crypto.encrypt(
        number, tenant_id=tenant_id, kind=PHONE_KIND
    )
    contact.phone_blind_index = phone_index(number, tenant_id=tenant_id)


def _phone_taken(session: Session, contact: Contact, *, tenant_id: uuid.UUID) -> bool:
    if contact.phone_blind_index is None:
        return False
    return (
        session.exec(
            select(Contact.id).where(
                Contact.tenant_id == tenant_id,
                Contact.phone_blind_index == contact.phone_blind_index,
                col(Contact.deleted_at).is_(None),
                Contact.id != contact.id,
            )
        ).first()
        is not None
    )


def _field_names(body: ContactCreate | ContactUpdate) -> list[str]:
    return sorted(body.model_fields_set)


def create_contact(*, actor: Actor, body: ContactCreate) -> ContactRead:
    """Insert one contact for the actor's workspace, audited on the same transaction."""
    with tenant_transaction(
        tenant_id=actor.tenant_id, actor_id=actor.user_id, actor_role=actor.actor_role
    ) as session:
        contact = Contact(
            tenant_id=actor.tenant_id,
            given_name=body.given_name,
            family_name=body.family_name,
            email=str(body.email) if body.email else None,
            tags=body.tags,
            external_ids=body.external_ids,
            timezone=body.timezone or DEFAULT_TIMEZONE,
        )
        _set_phone(contact, body.phone, tenant_id=actor.tenant_id)
        if body.whatsapp_opt_in:
            contact.whatsapp_opt_in = True
            contact.opt_in_at = datetime.now(UTC)
            contact.opt_in_source = body.opt_in_source or "MANUAL"
        if _phone_taken(session, contact, tenant_id=actor.tenant_id):
            raise ContactRefused(409, PHONE_TAKEN, "A contact with that number exists.")
        session.add(contact)
        session.flush()
        audit.record(
            session,
            audit.AuditEvent(
                action=CONTACT_CREATE,
                result="SUCCESS",
                resource_id=contact.id,
                payload={"field_set": _field_names(body)},
            ),
        )
        session.refresh(contact)
        return to_read(contact)


def _live(
    session: Session, *, tenant_id: uuid.UUID, contact_id: uuid.UUID
) -> Contact | None:
    return session.exec(
        select(Contact).where(
            Contact.id == contact_id,
            Contact.tenant_id == tenant_id,
            col(Contact.deleted_at).is_(None),
        )
    ).first()


def _denied(session: Session, *, action: str, contact_id: uuid.UUID) -> None:
    audit.record(
        session,
        audit.AuditEvent(
            action=action, result="DENIED", resource_id=contact_id, reason=NOT_FOUND
        ),
    )


def read_contact(
    *, actor: Actor, contact_id: uuid.UUID, source_ip: str | None = None
) -> ContactRead | None:
    """One live contact, audited. `None` for absent and for another workspace's alike."""
    with tenant_transaction(
        tenant_id=actor.tenant_id,
        actor_id=actor.user_id,
        actor_role=actor.actor_role,
        source_ip=source_ip,
    ) as session:
        contact = _live(session, tenant_id=actor.tenant_id, contact_id=contact_id)
        if contact is None:
            _denied(session, action=CONTACT_READ, contact_id=contact_id)
            return None
        audit.record(
            session,
            audit.AuditEvent(
                action=CONTACT_READ,
                result="SUCCESS",
                resource_id=contact.id,
                source_ip=source_ip,
                payload={"result_count": 1},
            ),
        )
        return to_read(contact)


def update_contact(
    *, actor: Actor, contact_id: uuid.UUID, body: ContactUpdate
) -> ContactRead | None:
    """A partial update of one live contact; only the fields sent are touched. Audited."""
    with tenant_transaction(
        tenant_id=actor.tenant_id, actor_id=actor.user_id, actor_role=actor.actor_role
    ) as session:
        contact = _live(session, tenant_id=actor.tenant_id, contact_id=contact_id)
        if contact is None:
            _denied(session, action=CONTACT_UPDATE, contact_id=contact_id)
            return None
        values = body.model_dump(exclude_unset=True)
        if "phone" in values:
            _set_phone(contact, values.pop("phone"), tenant_id=actor.tenant_id)
            if _phone_taken(session, contact, tenant_id=actor.tenant_id):
                raise ContactRefused(
                    409, PHONE_TAKEN, "A contact with that number exists."
                )
        if "email" in values and values["email"] is not None:
            values["email"] = str(values["email"])
        for not_null in (
            "given_name",
            "family_name",
            "tags",
            "external_ids",
            "timezone",
        ):
            if not_null in values and values[not_null] is None:
                values.pop(not_null)
        contact.sqlmodel_update(values)
        session.add(contact)
        session.flush()
        audit.record(
            session,
            audit.AuditEvent(
                action=CONTACT_UPDATE,
                result="SUCCESS",
                resource_id=contact.id,
                payload={"changed_fields": _field_names(body)},
            ),
        )
        session.refresh(contact)
        return to_read(contact)


def record_opt_in(
    *, actor: Actor, contact_id: uuid.UUID, body: ContactOptIn
) -> ContactRead | None:
    """Record a WhatsApp opt-in or opt-out, when and how. Audited with the new state and source."""
    with tenant_transaction(
        tenant_id=actor.tenant_id, actor_id=actor.user_id, actor_role=actor.actor_role
    ) as session:
        contact = _live(session, tenant_id=actor.tenant_id, contact_id=contact_id)
        if contact is None:
            _denied(session, action=CONTACT_UPDATE, contact_id=contact_id)
            return None
        contact.whatsapp_opt_in = body.whatsapp_opt_in
        contact.opt_in_at = datetime.now(UTC)
        contact.opt_in_source = body.source
        session.add(contact)
        session.flush()
        audit.record(
            session,
            audit.AuditEvent(
                action=CONTACT_UPDATE,
                result="SUCCESS",
                resource_id=contact.id,
                reason="OPT_IN" if body.whatsapp_opt_in else "OPT_OUT",
                payload={
                    "changed_fields": ["opt_in_at", "opt_in_source", "whatsapp_opt_in"]
                },
            ),
        )
        session.refresh(contact)
        return to_read(contact)


def change_status(
    *, actor: Actor, contact_id: uuid.UUID, change: ContactStatusChange
) -> ContactRead | None:
    with tenant_transaction(
        tenant_id=actor.tenant_id, actor_id=actor.user_id, actor_role=actor.actor_role
    ) as session:
        contact = _live(session, tenant_id=actor.tenant_id, contact_id=contact_id)
        if contact is None:
            _denied(session, action=CONTACT_UPDATE, contact_id=contact_id)
            return None
        contact.status = change.status
        session.add(contact)
        session.flush()
        audit.record(
            session,
            audit.AuditEvent(
                action=CONTACT_UPDATE,
                result="SUCCESS",
                resource_id=contact.id,
                reason=f"STATUS_{change.status}",
                payload={"changed_fields": ["status"]},
            ),
        )
        session.refresh(contact)
        return to_read(contact)


# -- list and search ---------------------------------------------------------------------------

NAME_PREFIX: Final = "name_prefix"
PHONE: Final = "phone"
TAG: Final = "tag"


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _term(word: str, *, tenant_id: uuid.UUID) -> tuple[str, ColumnElement[bool]]:
    if word.startswith("#") and len(word) > 1:
        return TAG, col(Contact.tags).any(word[1:].lower())  # type: ignore[arg-type]
    if sum(ch.isdigit() for ch in word) >= 8:
        try:
            number = phones.normalise(word)
        except phones.InvalidPhoneNumber:
            pass
        else:
            return PHONE, col(Contact.phone_blind_index) == phone_index(
                number, tenant_id=tenant_id
            )
    pattern = _escape_like(word.lower()) + "%"
    return NAME_PREFIX, or_(
        func.lower(col(Contact.given_name)).like(pattern),
        func.lower(col(Contact.family_name)).like(pattern),
        func.lower(col(Contact.email)).like(pattern),
    )


_CURSOR_CONTEXT: Final = b"notify.contacts.cursor.v1"


def _signature(*, tenant_id: uuid.UUID, scope: str, payload: bytes) -> str:
    message = b"\0".join((_CURSOR_CONTEXT, tenant_id.bytes, scope.encode(), payload))
    digest = hmac.new(settings.SECRET_KEY.encode(), message, hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest[:16]).decode().rstrip("=")


def encode_cursor(*, tenant_id: uuid.UUID, scope: str, contact_id: uuid.UUID) -> str:
    body = base64.urlsafe_b64encode(contact_id.bytes).decode().rstrip("=")
    return f"{body}.{_signature(tenant_id=tenant_id, scope=scope, payload=contact_id.bytes)}"


def decode_cursor(cursor: str, *, tenant_id: uuid.UUID, scope: str) -> uuid.UUID:
    try:
        body, signature = cursor.split(".", 1)
        payload = base64.urlsafe_b64decode(body + "=" * (-len(body) % 4))
    except ValueError as error:
        raise InvalidCursor("the cursor is not one this API issued") from error
    expected = _signature(tenant_id=tenant_id, scope=scope, payload=payload)
    if len(payload) != 16 or not hmac.compare_digest(signature, expected):
        raise InvalidCursor("the cursor is not one this API issued")
    return uuid.UUID(bytes=payload)


def _page(
    session: Session,
    *,
    tenant_id: uuid.UUID,
    scope: str,
    conditions: Sequence[ColumnElement[bool]],
    limit: int,
    boundary_id: uuid.UUID | None,
) -> ContactsPublic | None:
    live = [
        col(Contact.tenant_id) == tenant_id,
        col(Contact.deleted_at).is_(None),
        *conditions,
    ]
    after: list[ColumnElement[bool]] = []
    if boundary_id is not None:
        boundary = session.exec(
            select(Contact.family_name, Contact.given_name).where(
                col(Contact.id) == boundary_id, col(Contact.tenant_id) == tenant_id
            )
        ).first()
        if boundary is None:
            return None
        family_name, given_name = boundary
        after.append(
            tuple_(col(Contact.family_name), col(Contact.given_name), col(Contact.id))
            > tuple_(literal(family_name), literal(given_name), literal(boundary_id))
        )
    counted = select(func.count()).select_from(Contact).where(*live)
    rows = session.exec(
        select(Contact, counted.scalar_subquery())
        .where(*live, *after)
        .order_by(col(Contact.family_name), col(Contact.given_name), col(Contact.id))
        .limit(limit + 1)
    ).all()
    if rows:
        count = rows[0][1]
    elif boundary_id is None:
        count = 0
    else:
        count = session.exec(counted).one()
    page, overflow = [contact for contact, _ in rows[:limit]], rows[limit:]
    return ContactsPublic(
        data=[to_read(contact) for contact in page],
        count=count,
        next_cursor=(
            encode_cursor(tenant_id=tenant_id, scope=scope, contact_id=page[-1].id)
            if overflow
            else None
        ),
    )


def _read(
    *,
    tenant_id: uuid.UUID,
    context: ReadContext,
    scope: str,
    conditions: Sequence[ColumnElement[bool]],
    limit: int,
    cursor: str | None,
    query_filters: list[str] | None,
) -> ContactsPublic:
    result: ContactsPublic | None = None
    with tenant_transaction(
        tenant_id=tenant_id,
        actor_id=context.actor_id,
        actor_role=context.actor_role,
        source_ip=context.source_ip,
    ) as session:
        try:
            boundary_id = (
                None
                if cursor is None
                else decode_cursor(cursor, tenant_id=tenant_id, scope=scope)
            )
        except InvalidCursor:
            pass
        else:
            result = _page(
                session,
                tenant_id=tenant_id,
                scope=scope,
                conditions=conditions,
                limit=limit,
                boundary_id=boundary_id,
            )
        payload: dict[str, object] = {}
        if query_filters is not None:
            payload["query_filters"] = query_filters
        if result is not None:
            payload["result_count"] = len(result.data)
        audit.record(
            session,
            audit.AuditEvent(
                action=CONTACT_READ,
                result="DENIED" if result is None else "SUCCESS",
                reason=INVALID_CURSOR if result is None else None,
                source_ip=context.source_ip,
                payload=payload or None,
            ),
        )
    if result is None:
        raise InvalidCursor("the cursor is not one this API issued")
    return result


def list_contacts(
    *,
    tenant_id: uuid.UUID,
    context: ReadContext,
    limit: int,
    cursor: str | None = None,
    statuses: Sequence[str] | None = None,
) -> ContactsPublic:
    """One keyset page of the workspace's live contacts. Archived contacts only when asked for."""
    chosen = (
        sorted(set(statuses))
        if statuses
        else [s for s in CONTACT_STATUSES if s not in INACTIVE_STATUSES]
    )
    return _read(
        tenant_id=tenant_id,
        context=context,
        scope="list" if not statuses else "list:" + ",".join(chosen),
        conditions=[col(Contact.status).in_(chosen)],
        limit=limit,
        cursor=cursor,
        query_filters=["status"] if statuses else None,
    )


def search_contacts(
    *,
    tenant_id: uuid.UUID,
    context: ReadContext,
    q: str,
    limit: int,
    cursor: str | None = None,
) -> ContactsPublic:
    """One keyset page of live contacts matching every term of `q`. The term is never logged."""
    terms = [_term(word, tenant_id=tenant_id) for word in q.split()]
    return _read(
        tenant_id=tenant_id,
        context=context,
        scope="search:" + " ".join(q.lower().split()),
        conditions=[condition for _, condition in terms],
        limit=limit,
        cursor=cursor,
        query_filters=sorted({kind for kind, _ in terms}),
    )


def record_read_denial(
    *,
    tenant_id: uuid.UUID,
    context: ReadContext,
    reason: str,
    action: str = CONTACT_READ,
) -> None:
    """Audit a request the policy layer refused, before any contact row is read."""
    with tenant_transaction(
        tenant_id=tenant_id,
        actor_id=context.actor_id,
        actor_role=context.actor_role,
        source_ip=context.source_ip,
    ) as session:
        audit.record(
            session,
            audit.AuditEvent(
                action=action,
                result="DENIED",
                reason=reason,
                source_ip=context.source_ip,
            ),
        )


# -- the facade other modules use, on their own transaction -----------------------------------


def display_names(
    session: Session, *, tenant_id: uuid.UUID, contact_ids: Sequence[uuid.UUID]
) -> dict[uuid.UUID, str]:
    """`{id: "Given Family"}` for the live contacts among `contact_ids`; others are simply absent."""
    if not contact_ids:
        return {}
    rows = session.exec(
        select(Contact.id, Contact.given_name, Contact.family_name).where(
            Contact.tenant_id == tenant_id,
            col(Contact.id).in_(sorted(set(contact_ids))),
            col(Contact.deleted_at).is_(None),
        )
    ).all()
    return {cid: display_name(given, family) for cid, given, family in rows}


def queue_display_names(
    batch: ReadBatch, *, tenant_id: uuid.UUID, contact_ids: Sequence[uuid.UUID]
) -> Pending[dict[uuid.UUID, str]]:
    """`display_names`, queued on the caller's batch (`app.core.reads`)."""
    wanted = sorted(set(contact_ids))
    if not wanted:
        return Pending.ready({})
    rows = batch.rows(
        select(
            col(Contact.id), col(Contact.given_name), col(Contact.family_name)
        ).where(
            col(Contact.tenant_id) == tenant_id,
            col(Contact.id).in_(wanted),
            col(Contact.deleted_at).is_(None),
        )
    )
    return rows.then(
        lambda found: {cid: display_name(given, family) for cid, given, family in found}
    )


def contact_emails(
    session: Session, *, tenant_id: uuid.UUID, contact_ids: Sequence[uuid.UUID]
) -> dict[uuid.UUID, str]:
    """`{id: email}` for the live contacts among `contact_ids` that have one. Never logged."""
    if not contact_ids:
        return {}
    rows = session.exec(
        select(col(Contact.id), col(Contact.email)).where(
            Contact.tenant_id == tenant_id,
            col(Contact.id).in_(sorted(set(contact_ids))),
            col(Contact.deleted_at).is_(None),
            col(Contact.email).is_not(None),
        )
    ).all()
    return {cid: email for cid, email in rows if email}


def opted_out_ids(
    session: Session, *, tenant_id: uuid.UUID, contact_ids: Sequence[uuid.UUID]
) -> set[uuid.UUID]:
    """The contacts among `contact_ids` who opted out of reminders and campaigns."""
    if not contact_ids:
        return set()
    return set(
        session.exec(
            select(Contact.id).where(
                col(Contact.tenant_id) == tenant_id,
                col(Contact.id).in_(sorted(set(contact_ids))),
                col(Contact.receives_communications).is_(False),
            )
        ).all()
    )


def blocked_contact_ids(
    session: Session, *, tenant_id: uuid.UUID, contact_ids: Sequence[uuid.UUID]
) -> set[uuid.UUID]:
    """The `BLOCKED` contacts among `contact_ids`: they take no new booking."""
    if not contact_ids:
        return set()
    return set(
        session.exec(
            select(Contact.id).where(
                col(Contact.tenant_id) == tenant_id,
                col(Contact.id).in_(list(contact_ids)),
                col(Contact.status) == "BLOCKED",
            )
        ).all()
    )


def match_or_create_contact(
    session: Session,
    *,
    tenant_id: uuid.UUID,
    given_name: str,
    family_name: str,
    email: str,
    phone: str,
    source_ip: str | None = None,
) -> tuple[uuid.UUID, bool]:
    """The contact a public booking is for: the live contact with that number, or a new one.

    On the caller's transaction, so the contact, the booking and their audit events commit together.
    A matched contact is never changed (an anonymous form is not a source of truth), and the caller
    answers identically either way, so the response cannot reveal whether someone is a contact.
    """
    try:
        number = phones.normalise(phone)
    except phones.InvalidPhoneNumber:
        raise ContactRefused(422, PHONE_INVALID, "That phone number isn't valid.")
    index = phone_index(number, tenant_id=tenant_id)
    existing = session.exec(
        select(Contact.id).where(
            Contact.tenant_id == tenant_id,
            col(Contact.deleted_at).is_(None),
            Contact.phone_blind_index == index,
        )
    ).first()
    if existing is not None:
        return existing, False
    contact = Contact(
        tenant_id=tenant_id,
        given_name=given_name,
        family_name=family_name,
        email=email,
        phone_e164=field_crypto.encrypt(number, tenant_id=tenant_id, kind=PHONE_KIND),
        phone_blind_index=index,
    )
    session.add(contact)
    session.flush()
    audit.record(
        session,
        audit.AuditEvent(
            action=CONTACT_CREATE,
            result="SUCCESS",
            resource_id=contact.id,
            source_ip=source_ip,
            payload={"field_set": ["email", "family_name", "given_name", "phone"]},
        ),
    )
    return contact.id, True
