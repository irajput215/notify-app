"""The closed action catalogue and the payload allow-list: frozen reference data.

- **Actions are a closed vocabulary.** Nothing outside `ACTION_CATALOGUE` may be written to
  `audit_log`; a new action is registered here, with its resource type and its payload keys, before
  any code emits it.
- **The payload is allow-listed per action** (deny by default). An unlisted key throws and the
  request fails `500 AUDIT_PAYLOAD_REJECTED`, so a message body, a phone number or a token can never
  reach the trail by accident: there is no key for them.
- **Role changes** emit `user.permission_change` for both a grant and a revoke; which one is in the
  payload's `change` key (`GRANT`, `REVOKE`, `NONE`).
"""

from types import MappingProxyType
from typing import Final

# The `resource_type` vocabulary. Closed, like the actions.
RESOURCE_TYPES: Final[frozenset[str]] = frozenset(
    {
        "CONTACT",
        "USER",
        "TENANT",
        "SESSION",
        "AUDIT",
        "REPORT",
        "INTEGRATION",
        "EXPORT",
        "APPOINTMENT",
    }
)

# The `result` vocabulary. `UNKNOWN` is a provider timeout or an unresolved outcome.
RESULTS: Final[frozenset[str]] = frozenset({"SUCCESS", "DENIED", "FAILED", "UNKNOWN"})

# The closed action catalogue, grouped by resource type. Values are lowercase dotted.
ACTION_CATALOGUE: Final[tuple[tuple[str, tuple[str, ...]], ...]] = (
    (
        "SESSION",
        (
            "auth.login",
            "auth.logout",
            "auth.login_failed",
            "auth.step_up",
            "auth.step_up_failed",
        ),
    ),
    ("CONTACT", ("contact.read", "contact.create", "contact.update", "contact.export")),
    ("USER", ("user.permission_change", "user.create", "user.deactivate")),
    ("TENANT", ("tenant.security_config_change", "tenant.config_changed")),
    ("INTEGRATION", ("integration.request",)),
    ("AUDIT", ("audit.read",)),
    (
        "APPOINTMENT",
        ("appointment.create", "appointment.state_change", "appointment.read"),
    ),
)

# Derived, never a second source of truth.
ACTIONS: Final[frozenset[str]] = frozenset(
    action for _resource_type, actions in ACTION_CATALOGUE for action in actions
)

# The action -> resource-type mapping, derived from the same tuple so the two cannot drift.
RESOURCE_TYPE_BY_ACTION: Final[MappingProxyType[str, str]] = MappingProxyType(
    {
        action: resource_type
        for resource_type, actions in ACTION_CATALOGUE
        for action in actions
    }
)

# Every key any action may carry in its `metadata` payload. **No value**: every key names a field, a
# code or a count. `changed_fields`, `field_set`, `added` and `removed` carry *names*; `reason` a
# controlled code. Message text, phone numbers, emails, tokens and full request bodies are refused by
# construction: there is no key for them, and an unknown key throws.
PAYLOAD_KEYS: Final[frozenset[str]] = frozenset(
    {
        "added",
        "change",
        "changed_fields",
        "contact_id",
        "error_class",
        "field_set",
        "from_state",
        "latency_ms",
        "mfa_method",
        "operation",
        "outcome_class",
        "provider",
        "query_filters",
        "reason",
        "record_count",
        "removed",
        "result_count",
        "role_code",
        "source",
        "step_up",
        "target_user_id",
        "to_state",
    }
)

# The keys each action may carry. An action absent from this mapping may carry **no** payload at all.
PAYLOAD_ALLOW_LIST: Final[MappingProxyType[str, frozenset[str]]] = MappingProxyType(
    {
        # Field **names** only, never values.
        "contact.create": frozenset({"field_set"}),
        "contact.update": frozenset({"changed_fields"}),
        # A list or search records how many contacts came back and the *kinds* of term used
        # (`name_prefix`, `phone`, `tag`), never the term itself.
        "contact.read": frozenset({"result_count", "query_filters"}),
        "audit.read": frozenset({"query_filters", "result_count"}),
        # A role grant or revoke: the target, the role code, and the change.
        "user.permission_change": frozenset(
            {"target_user_id", "role_code", "change", "added", "removed", "step_up"}
        ),
        # A staff invitation (and a resend, `change = INVITATION_RESENT`): the target and the role
        # codes; the inviter is the envelope's `actor_id`.
        "user.create": frozenset({"target_user_id", "added", "change", "step_up"}),
        # A workspace configuration change: the names of the fields that changed.
        "tenant.config_changed": frozenset({"changed_fields", "step_up"}),
        # A booking: the contact it is for and where it came from (`STAFF` or `PUBLIC_BOOKING`).
        "appointment.create": frozenset({"contact_id", "source"}),
        "appointment.state_change": frozenset({"from_state", "to_state"}),
        # A contact-level read names the contact; a workspace-wide read (the calendar) the kinds of
        # filter and the row count.
        "appointment.read": frozenset({"contact_id", "query_filters", "result_count"}),
        "auth.step_up": frozenset({"operation", "mfa_method"}),
        "auth.step_up_failed": frozenset({"operation"}),
        # One per outbound provider call (email today; WhatsApp and connectors next).
        "integration.request": frozenset({"provider", "outcome_class", "latency_ms"}),
    }
)

# The refusal reason code. Requirement R11 and T-AUD-4 name it exactly: an unlisted `metadata` key
# throws `AUDIT_PAYLOAD_REJECTED` and the request fails.
PAYLOAD_REJECTED: Final[str] = "AUDIT_PAYLOAD_REJECTED"


def resource_type_for(action: str) -> str:
    """The `resource_type` the catalogue binds to `action`.

    Raises `KeyError` for an action outside the catalogue, so a typo cannot reach the writer: the
    caller that invented a name fails at its own call site rather than writing an event no catalogue
    names.
    """
    return RESOURCE_TYPE_BY_ACTION[action]
