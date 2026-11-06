"""Pure functions: no database."""

import uuid

import pytest

from app.core import field_crypto
from app.core.logging import scrub_text
from app.modules.contacts.phone import InvalidPhoneNumber, normalise
from app.modules.users_roles.catalog import PERMISSION_CODES, SYSTEM_ROLE_CATALOGUE


@pytest.mark.parametrize(
    ("raw", "e164"),
    [
        ("0412 345 678", "+61412345678"),
        ("+61 412-345-678", "+61412345678"),
        ("61412345678", "+61412345678"),
        ("(02) 9876 5432", "+61298765432"),
        ("0044 20 7946 0958", "+442079460958"),
    ],
)
def test_phone_normalisation(raw: str, e164: str) -> None:
    assert normalise(raw) == e164


@pytest.mark.parametrize("raw", ["", "12", "hello", "+0123456789", "+1234567890123456"])
def test_phone_normalisation_refuses(raw: str) -> None:
    with pytest.raises(InvalidPhoneNumber):
        normalise(raw)


def test_field_crypto_round_trip_is_bound_to_tenant_and_kind() -> None:
    tenant, other = uuid.uuid4(), uuid.uuid4()
    sealed = field_crypto.encrypt(
        "+61412345678", tenant_id=tenant, kind="contact.phone"
    )
    assert (
        field_crypto.decrypt(sealed, tenant_id=tenant, kind="contact.phone")
        == "+61412345678"
    )
    assert field_crypto.decrypt(sealed, tenant_id=other, kind="contact.phone") is None
    assert field_crypto.decrypt(sealed, tenant_id=tenant, kind="meta.token") is None
    assert field_crypto.blind_index(
        "+61412345678", tenant_id=tenant, kind="contact.phone"
    ) != field_crypto.blind_index("+61412345678", tenant_id=other, kind="contact.phone")


@pytest.mark.parametrize(
    "secret",
    [
        "+61 412 345 678",
        "0412 345 678",
        "EAAGm0PX4ZCpsBAKZB1234567890abcdef",
        "MS0xMjM0NTY3ODkwYWJjZGVmZ2hp-au1",
        "Bearer abc.def.ghi123",
    ],
)
def test_log_redaction(secret: str) -> None:
    assert secret not in scrub_text(f"value {secret} end")


def test_role_bundles() -> None:
    bundles = {code: grants for code, _, grants in SYSTEM_ROLE_CATALOGUE}
    assert bundles["OWNER"] == PERMISSION_CODES
    assert "billing:manage" not in bundles["ADMIN"]
    assert "workspace:configure" not in bundles["ADMIN"]
    assert bundles["AGENT"] == {
        "inbox:read",
        "inbox:reply",
        "contacts:read",
        "contacts:manage",
    }
