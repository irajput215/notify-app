"""The client's address when the app runs behind a known number of proxies.

On Cloud Run every request reaches the container from Google's front end, so the ASGI peer address
is Google's, not the client's: the per-address rate limit would put every anonymous caller in a
handful of shared buckets, and the audit trail's `source_ip` would name the proxy.

Uvicorn's own proxy-header support trusts a list of peer IPs, which Cloud Run cannot give, or every
peer (`*`), which takes the *leftmost* `X-Forwarded-For` entry: a value the client controls. This
middleware instead takes the entry `TRUSTED_PROXY_HOPS` from the right. Each trusted proxy appends the
address it received the request from, so with one trusted hop (Cloud Run) the last entry is the
address Google saw, and anything a client prepends is ignored.

`TRUSTED_PROXY_HOPS = 0` (the default) changes nothing: the socket's peer is the client.
"""

from typing import Final

from starlette.types import ASGIApp, Receive, Scope, Send

_HEADER: Final = b"x-forwarded-for"


class TrustedProxyMiddleware:
    def __init__(self, app: ASGIApp, *, hops: int) -> None:
        self.app = app
        self.hops = hops

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if self.hops > 0 and scope["type"] in ("http", "websocket"):
            client = self._client(scope)
            if client is not None:
                port = scope["client"][1] if scope.get("client") else 0
                scope = {**scope, "client": (client, port)}
        await self.app(scope, receive, send)

    def _client(self, scope: Scope) -> str | None:
        values = [
            value.decode("latin-1")
            for name, value in scope.get("headers", [])
            if name.lower() == _HEADER
        ]
        if not values:
            return None
        entries = [
            entry.strip() for entry in ",".join(values).split(",") if entry.strip()
        ]
        if len(entries) < self.hops:
            return None
        return entries[-self.hops]
