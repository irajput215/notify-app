"""The `contacts` table: the people a workspace messages and books.

A contact is the messaging identity: a phone number in E.164 (WhatsApp's address), an optional email,
a name, free-form tags, and the record of their WhatsApp opt-in. It replaces ClinicOS's `patients`
table without the clinical fields (no date of birth, Medicare, IHI, alerts or emergency contacts).

- **The phone number is encrypted at rest** (`app.core.field_crypto`, kind `contact.phone`) with a keyed
  blind index for exact match, so the database never holds a searchable plaintext number. One live
  contact per number per workspace (`uq_contacts_tenant_phone_blind_index`, partial on
  `deleted_at IS NULL`).
- **Opt-in is evidence, not a flag.** `whatsapp_opt_in` says whether business-initiated messages may be
  sent; `opt_in_at` and `opt_in_source` say when and how it was given (or withdrawn), which is what
  Meta's policy asks a business to be able to show.
- **`external_ids`** maps a connector to its id for this person (`{"cliniko": "123"}`).
- **Row-level security** is forced by the baseline migration, as on every tenant table.
"""

import uuid
from datetime import UTC, datetime
from typing import Any, Final

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlmodel import Field, SQLModel

CONTACT_STATUSES: Final[tuple[str, ...]] = ("ACTIVE", "BLOCKED", "ARCHIVED")
#: Hidden from the contact list unless asked for; search still finds them.
INACTIVE_STATUSES: Final[frozenset[str]] = frozenset({"ARCHIVED"})
#: How an opt-in (or opt-out) was captured.
OPT_IN_SOURCES: Final[tuple[str, ...]] = (
    "MANUAL",
    "WEB_FORM",
    "BOOKING",
    "WHATSAPP",
    "IMPORT",
    "CONNECTOR",
)
DEFAULT_TIMEZONE: Final = "Australia/Sydney"
#: The `field_crypto` kind the phone number is sealed and indexed under.
PHONE_KIND: Final = "contact.phone"


def _in(values: tuple[str, ...]) -> str:
    return ", ".join(f"'{value}'" for value in values)


def _utcnow() -> datetime:
    return datetime.now(UTC)


_TIMESTAMPTZ = sa.DateTime(timezone=True)


class Contact(SQLModel, table=True):
    __tablename__ = "contacts"
    __table_args__ = (
        sa.CheckConstraint(f"status IN ({_in(CONTACT_STATUSES)})", name="status"),
        sa.CheckConstraint(
            f"opt_in_source IS NULL OR opt_in_source IN ({_in(OPT_IN_SOURCES)})",
            name="opt_in_source",
        ),
        # An opt-in is never recorded without when it happened.
        sa.CheckConstraint(
            "NOT whatsapp_opt_in OR opt_in_at IS NOT NULL", name="opt_in_has_time"
        ),
        sa.CheckConstraint(
            "(phone_e164 IS NULL) = (phone_blind_index IS NULL)", name="phone_pair"
        ),
        sa.UniqueConstraint("tenant_id", "id", name="uq_contacts_tenant_id_id"),
        sa.Index(
            "ix_contacts_tenant_family_name", "tenant_id", "family_name", "given_name"
        ),
        sa.Index(
            "uq_contacts_tenant_phone_blind_index",
            "tenant_id",
            "phone_blind_index",
            unique=True,
            postgresql_where=sa.text(
                "deleted_at IS NULL AND phone_blind_index IS NOT NULL"
            ),
        ),
        sa.Index("ix_contacts_tenant_tags", "tags", postgresql_using="gin"),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        sa_column_kwargs={"server_default": sa.text("gen_random_uuid()")},
    )
    tenant_id: uuid.UUID = Field(
        foreign_key="tenants.id", ondelete="RESTRICT", nullable=False
    )
    given_name: str = Field(max_length=100)
    family_name: str = Field(
        default="", max_length=100, sa_column_kwargs={"server_default": ""}
    )
    email: str | None = Field(default=None, max_length=255)
    # AES-256-GCM ciphertext of the E.164 number, and its keyed blind index (`field_crypto`).
    phone_e164: bytes | None = None
    phone_blind_index: bytes | None = None
    whatsapp_opt_in: bool = Field(
        default=False, sa_column_kwargs={"server_default": sa.false()}
    )
    opt_in_at: datetime | None = Field(default=None, sa_type=_TIMESTAMPTZ)
    opt_in_source: str | None = Field(default=None, max_length=32)
    # Off only for an explicit opt-out: it silences reminders and campaigns, never transactional
    # messages such as a booking confirmation.
    receives_communications: bool = Field(
        default=True, sa_column_kwargs={"server_default": sa.true()}
    )
    tags: list[str] = Field(
        default_factory=list,
        sa_column=sa.Column(
            ARRAY(sa.String(64)), nullable=False, server_default=sa.text("'{}'")
        ),
    )
    external_ids: dict[str, Any] = Field(
        default_factory=dict,
        sa_column=sa.Column(JSONB, nullable=False, server_default=sa.text("'{}'")),
    )
    status: str = Field(default="ACTIVE", sa_column_kwargs={"server_default": "ACTIVE"})
    timezone: str = Field(
        default=DEFAULT_TIMEZONE,
        max_length=64,
        sa_column_kwargs={"server_default": DEFAULT_TIMEZONE},
    )
    deleted_at: datetime | None = Field(default=None, sa_type=_TIMESTAMPTZ)
    created_at: datetime = Field(default_factory=_utcnow, sa_type=_TIMESTAMPTZ)
    updated_at: datetime = Field(
        default_factory=_utcnow,
        sa_type=_TIMESTAMPTZ,
        sa_column_kwargs={"onupdate": _utcnow},
    )


# Case-insensitive prefix search on the names and the email, one expression index each, `tenant_id`
# leading (`lower(col) LIKE 'smi%'` becomes an index range under `text_pattern_ops`).
_contacts_table = Contact.metadata.tables["contacts"]
for _column in ("family_name", "given_name", "email"):
    sa.Index(
        f"ix_contacts_tenant_{_column}_lower",
        _contacts_table.c.tenant_id,
        sa.func.lower(_contacts_table.c[_column]).label(f"{_column}_lower"),
        postgresql_ops={f"{_column}_lower": "text_pattern_ops"},
    )
