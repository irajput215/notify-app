"""The platform guarantees Notify is built on, end to end through the API as `notify_app`."""

import logging
import uuid
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session as DbSession

from app.core.db import tenant_transaction
from app.modules.audit import service as audit
from tests.helpers import API, PASSWORD, Session, log_in, me, sign_up, token_from


@pytest.fixture(scope="module")
def workspace_a(client: TestClient) -> Session:
    mail: list[dict[str, Any]] = []
    from unittest.mock import patch

    with patch("app.utils.send_email", side_effect=lambda **m: mail.append(m)):
        return sign_up(client, mail, workspace="Alpha Physio")


@pytest.fixture(scope="module")
def workspace_b(client: TestClient) -> Session:
    mail: list[dict[str, Any]] = []
    from unittest.mock import patch

    with patch("app.utils.send_email", side_effect=lambda **m: mail.append(m)):
        return sign_up(client, mail, workspace="Bravo Dental")


def test_signup_makes_the_signer_owner_with_every_permission(
    client: TestClient, workspace_a: Session
) -> None:
    response = client.get(f"{API}/users/me/permissions", headers=workspace_a.headers)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["role_codes"] == ["OWNER"]
    assert {"contacts:manage", "billing:manage", "workspace:configure"} <= set(
        body["permissions"]
    )
    roles = client.get(f"{API}/roles", headers=workspace_a.headers).json()["data"]
    assert sorted(role["code"] for role in roles) == ["ADMIN", "AGENT", "OWNER"]


def test_workspace_current_and_profile(
    client: TestClient, workspace_a: Session
) -> None:
    current = client.get(f"{API}/workspaces/current", headers=workspace_a.headers)
    assert current.status_code == 200, current.text
    assert current.json()["id"] == str(workspace_a.tenant_id)
    renamed = client.patch(
        f"{API}/workspaces/current/profile",
        headers=workspace_a.headers,
        json={"display_name": "Alpha Physio Sydney"},
    )
    assert renamed.status_code == 200, renamed.text
    assert renamed.json()["display_name"] == "Alpha Physio Sydney"


def test_contact_lifecycle_and_phone_search(
    client: TestClient, workspace_a: Session
) -> None:
    created = client.post(
        f"{API}/contacts",
        headers=workspace_a.headers,
        json={
            "given_name": "Jane",
            "family_name": "Citizen",
            "phone": "0412 345 678",
            "email": "jane@example.com",
            "tags": ["VIP", "new"],
            "whatsapp_opt_in": True,
            "opt_in_source": "WEB_FORM",
        },
    )
    assert created.status_code == 201, created.text
    contact = created.json()
    assert contact["phone"] == "+61412345678"
    assert contact["tags"] == ["new", "vip"]
    assert contact["whatsapp_opt_in"] is True and contact["opt_in_at"]

    duplicate = client.post(
        f"{API}/contacts",
        headers=workspace_a.headers,
        json={"given_name": "Other", "phone": "+61 412 345 678"},
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"]["code"] == "PHONE_TAKEN"

    found = client.post(
        f"{API}/contacts/search",
        headers=workspace_a.headers,
        json={"q": "+61412345678"},
    ).json()
    assert [c["id"] for c in found["data"]] == [contact["id"]]
    by_tag = client.post(
        f"{API}/contacts/search", headers=workspace_a.headers, json={"q": "#vip"}
    ).json()
    assert [c["id"] for c in by_tag["data"]] == [contact["id"]]

    opted_out = client.post(
        f"{API}/contacts/{contact['id']}/opt-in",
        headers=workspace_a.headers,
        json={"whatsapp_opt_in": False, "source": "WHATSAPP"},
    )
    assert opted_out.status_code == 200, opted_out.text
    assert opted_out.json()["whatsapp_opt_in"] is False

    updated = client.patch(
        f"{API}/contacts/{contact['id']}",
        headers=workspace_a.headers,
        json={"family_name": "Smith"},
    )
    assert updated.status_code == 200 and updated.json()["family_name"] == "Smith"

    listed = client.get(f"{API}/contacts", headers=workspace_a.headers).json()
    assert listed["count"] == 1


def test_invalid_phone_is_refused(client: TestClient, workspace_a: Session) -> None:
    response = client.post(
        f"{API}/contacts",
        headers=workspace_a.headers,
        json={"given_name": "Bad", "phone": "12"},
    )
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "PHONE_INVALID"


def test_workspaces_cannot_see_each_other(
    client: TestClient, workspace_a: Session, workspace_b: Session
) -> None:
    contact = client.post(
        f"{API}/contacts", headers=workspace_b.headers, json={"given_name": "Bob"}
    ).json()
    # Another workspace's contact is 404, never 403, and never in a list.
    assert (
        client.get(
            f"{API}/contacts/{contact['id']}", headers=workspace_a.headers
        ).status_code
        == 404
    )
    assert (
        client.patch(
            f"{API}/contacts/{contact['id']}",
            headers=workspace_a.headers,
            json={"given_name": "Mallory"},
        ).status_code
        == 404
    )
    a_ids = {
        c["id"]
        for c in client.get(f"{API}/contacts", headers=workspace_a.headers).json()[
            "data"
        ]
    }
    assert contact["id"] not in a_ids

    staff = client.get(f"{API}/users/staff", headers=workspace_a.headers).json()["data"]
    assert {member["id"] for member in staff} == {str(workspace_a.user_id)}

    # B's audit events for the contact are invisible to A, even asked for by id: A sees only its
    # own refused attempts above, never B's create.
    trail = client.get(
        f"{API}/audit",
        headers=workspace_a.headers,
        params={"resource_id": contact["id"]},
    )
    assert trail.status_code == 200, trail.text
    assert {event["result"] for event in trail.json()["data"]} == {"DENIED"}
    own = client.get(
        f"{API}/audit",
        headers=workspace_b.headers,
        params={"resource_id": contact["id"]},
    )
    assert own.status_code == 200 and own.json()["data"]

    # And underneath the API: RLS hides B's rows from a transaction in A's context.
    with tenant_transaction(tenant_id=workspace_a.tenant_id) as session:
        rows = (
            session.connection()
            .exec_driver_sql(
                "SELECT count(*) FROM contacts WHERE id = %(id)s",
                {"id": uuid.UUID(contact["id"])},
            )
            .scalar_one()
        )
        assert rows == 0


def test_invite_accept_and_agent_permissions(
    client: TestClient, workspace_a: Session, _no_real_mail: list[dict[str, Any]]
) -> None:
    roles = client.get(f"{API}/roles", headers=workspace_a.headers).json()["data"]
    agent = next(role for role in roles if role["code"] == "AGENT")
    email = f"agent-{uuid.uuid4().hex[:8]}@example.com"
    invited = client.post(
        f"{API}/users/staff",
        headers=workspace_a.headers,
        json={"email": email, "full_name": "Andy Agent", "role_ids": [agent["id"]]},
    )
    assert invited.status_code == 201, invited.text
    accepted = client.post(
        f"{API}/users/invitations/accept",
        json={
            "token": token_from(_no_real_mail, "accept-invite"),
            "new_password": PASSWORD,
        },
    )
    assert accepted.status_code == 200, accepted.text

    token = log_in(client, email, PASSWORD)
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get(f"{API}/contacts", headers=headers).status_code == 200
    # An agent works the inbox; the team and the audit trail are not theirs.
    assert client.get(f"{API}/users/staff", headers=headers).status_code == 403
    assert (
        client.get(
            f"{API}/audit", headers=headers, params={"action": "contact.read"}
        ).status_code
        == 403
    )


def test_password_reset(
    client: TestClient, workspace_a: Session, _no_real_mail: list[dict[str, Any]]
) -> None:
    email = me(client, workspace_a.token)["email"]
    assert client.post(f"{API}/password-recovery/{email}").status_code == 200
    reset = client.post(
        f"{API}/reset-password/",
        json={
            "token": token_from(_no_real_mail, "reset-password"),
            "new_password": "a-new-pass-77",
        },
    )
    assert reset.status_code == 200, reset.text
    log_in(client, email, "a-new-pass-77")


def test_audit_chain_verifies(workspace_a: Session) -> None:
    with tenant_transaction(tenant_id=workspace_a.tenant_id) as session:
        assert isinstance(session, DbSession)
        report = audit.verify_chain(session, tenant_id=workspace_a.tenant_id)
    assert report.verified, report
    assert report.events > 0


def test_phone_numbers_are_redacted_from_logs(
    client: TestClient, workspace_a: Session
) -> None:
    """The request line the app's JSON sink writes for a phone search never carries the number.

    Message-level scrubbing of free text is covered by `test_units.test_log_redaction`.
    """
    import io

    from app.core.logging import build_handler

    stream = io.StringIO()
    handler = build_handler(stream=stream)
    root = logging.getLogger()
    root.addHandler(handler)
    try:
        client.post(
            f"{API}/contacts/search",
            headers=workspace_a.headers,
            json={"q": "+61412345678"},
        )
    finally:
        root.removeHandler(handler)
    output = stream.getvalue()
    assert '"route": "/contacts/search"' in output, (
        "no request line; the check would be vacuous"
    )
    assert "412345678" not in output
