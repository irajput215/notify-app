"""Drive the real signup and invitation flows through the API, reading links out of captured mail."""

import re
import uuid
from dataclasses import dataclass
from typing import Any

from fastapi.testclient import TestClient

from app.core.config import settings

API = settings.API_V1_STR
PASSWORD = "correct-horse-battery-9"


def token_from(mail: list[dict[str, Any]], path: str) -> str:
    """The token of the last `/<path>?token=...` link in the captured mail."""
    for message in reversed(mail):
        found = re.search(rf"/{path}\?token=([A-Za-z0-9._-]+)", message["html_content"])
        if found:
            return found.group(1)
    raise AssertionError(f"no /{path} link in the captured mail")


@dataclass(frozen=True)
class Session:
    user_id: uuid.UUID
    tenant_id: uuid.UUID
    token: str

    @property
    def headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.token}"}


def me(client: TestClient, token: str) -> dict[str, Any]:
    response = client.get(
        f"{API}/users/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, response.text
    body: dict[str, Any] = response.json()
    return body


def sign_up(
    client: TestClient, mail: list[dict[str, Any]], *, workspace: str
) -> Session:
    email = f"owner-{uuid.uuid4().hex[:8]}@example.com"
    response = client.post(
        f"{API}/users/signup",
        json={
            "email": email,
            "password": PASSWORD,
            "full_name": "Olive Owner",
            "workspace_name": workspace,
        },
    )
    assert response.status_code == 202, response.text
    verified = client.post(
        f"{API}/users/signup/verify", json={"token": token_from(mail, "verify-email")}
    )
    assert verified.status_code == 200, verified.text
    token = verified.json()["access_token"]
    account = me(client, token)
    return Session(uuid.UUID(account["id"]), uuid.UUID(account["tenant_id"]), token)


def log_in(client: TestClient, email: str, password: str) -> str:
    response = client.post(
        f"{API}/login/access-token", data={"username": email, "password": password}
    )
    assert response.status_code == 200, response.text
    return str(response.json()["access_token"])
