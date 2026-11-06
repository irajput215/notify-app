"""Request and response shapes for `/api/v1/contacts`."""

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

ContactStatus = Literal["ACTIVE", "BLOCKED", "ARCHIVED"]
OptInSource = Literal[
    "MANUAL", "WEB_FORM", "BOOKING", "WHATSAPP", "IMPORT", "CONNECTOR"
]

# A personal name as typed: no control characters, no markup, bounded.
NAME_PATTERN = r"^[^\x00-\x1f\x7f<>]{1,100}$"
FAMILY_NAME_PATTERN = r"^[^\x00-\x1f\x7f<>]{0,100}$"
TAG_PATTERN = r"^[a-z0-9][a-z0-9_-]{0,63}$"
MAX_TAGS = 20


def _clean_tags(tags: list[str] | None) -> list[str] | None:
    if tags is None:
        return None
    return sorted({tag.strip().lower() for tag in tags if tag.strip()})


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ContactCreate(_Strict):
    given_name: str = Field(pattern=NAME_PATTERN)
    family_name: str = Field(default="", pattern=FAMILY_NAME_PATTERN)
    email: EmailStr | None = Field(default=None, max_length=255)
    #: Any common format; stored as E.164.
    phone: str | None = Field(default=None, max_length=32)
    tags: list[str] = Field(default_factory=list, max_length=MAX_TAGS)
    external_ids: dict[str, str] = Field(default_factory=dict, max_length=10)
    whatsapp_opt_in: bool = False
    opt_in_source: OptInSource | None = None
    timezone: str | None = Field(default=None, max_length=64)

    _tags = field_validator("tags")(_clean_tags)


class ContactUpdate(_Strict):
    given_name: str | None = Field(default=None, pattern=NAME_PATTERN)
    family_name: str | None = Field(default=None, pattern=FAMILY_NAME_PATTERN)
    email: EmailStr | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=32)
    tags: list[str] | None = Field(default=None, max_length=MAX_TAGS)
    external_ids: dict[str, str] | None = Field(default=None, max_length=10)
    receives_communications: bool | None = None
    timezone: str | None = Field(default=None, max_length=64)

    _tags = field_validator("tags")(_clean_tags)


class ContactOptIn(_Strict):
    """`POST /contacts/{id}/opt-in`: record a WhatsApp opt-in or opt-out, and how it was given."""

    whatsapp_opt_in: bool
    source: OptInSource


class ContactStatusChange(_Strict):
    status: ContactStatus


class ContactRead(BaseModel):
    id: uuid.UUID
    given_name: str
    family_name: str
    display_name: str
    email: str | None
    phone: str | None
    whatsapp_opt_in: bool
    opt_in_at: datetime | None
    opt_in_source: str | None
    receives_communications: bool
    tags: list[str]
    external_ids: dict[str, Any]
    status: ContactStatus
    timezone: str
    created_at: datetime
    updated_at: datetime


class ContactsPublic(BaseModel):
    data: list[ContactRead]
    count: int
    next_cursor: str | None = None


class ContactSearch(_Strict):
    """`POST /contacts/search`. A body, not a URL, so a name or number never lands in a log line."""

    q: str = Field(min_length=1, max_length=100)
    limit: int = Field(default=50, ge=1, le=100)
    cursor: str | None = Field(default=None, max_length=200)
