"""The permission catalogue and the three system role bundles: frozen reference data.

Notify has three system roles per workspace:

- `OWNER`: everything, including billing and the workspace's security configuration. The person who
  signs up is the owner (`BOOTSTRAP_ROLE_CODE`).
- `ADMIN`: runs the workspace day to day: team, templates, workflows, integrations and the audit
  trail, but not billing or workspace security configuration.
- `AGENT`: works the inbox: reads and replies to conversations and manages contacts.

Roles are thin bundles over granular permissions. `app.modules.users_roles.policy.can` reads only the
permission set, never a role name, so a new role is a new bundle here and nothing else. The codes are
seeded per workspace by `service.seed_tenant_roles`; the global `permissions` rows by the baseline
migration.
"""

from typing import Final

# (code, description). The order is the order screens list them in.
PERMISSION_CATALOGUE: Final[tuple[tuple[str, str], ...]] = (
    ("inbox:read", "Read conversations in the workspace inbox."),
    ("inbox:reply", "Reply to, assign and close conversations."),
    ("contacts:read", "Read contacts and their bookings."),
    ("contacts:manage", "Create and update contacts, their opt-in and their bookings."),
    ("templates:manage", "Create and submit message templates."),
    ("workflows:manage", "Create and change automated workflows."),
    ("integrations:manage", "Connect channels and booking systems."),
    ("billing:manage", "Manage the workspace's plan and billing."),
    ("audit:read", "Read the workspace's audit trail."),
    ("users:manage", "Invite people, and assign and revoke their roles."),
    ("workspace:read", "Read the workspace's identity, status and data region."),
    (
        "workspace:configure",
        "Change the workspace's settings and security configuration.",
    ),
)

_ALL: Final[frozenset[str]] = frozenset(code for code, _ in PERMISSION_CATALOGUE)

# (code, display name, granted permission codes). A code absent from a bundle is a denial.
SYSTEM_ROLE_CATALOGUE: Final[tuple[tuple[str, str, frozenset[str]], ...]] = (
    ("OWNER", "Owner", _ALL),
    (
        "ADMIN",
        "Admin",
        _ALL - {"billing:manage", "workspace:configure"},
    ),
    (
        "AGENT",
        "Agent",
        frozenset({"inbox:read", "inbox:reply", "contacts:read", "contacts:manage"}),
    ),
)

# Convenience lookups, derived; never a second source of truth.
PERMISSION_CODES: Final[frozenset[str]] = _ALL
SYSTEM_ROLE_CODES: Final[tuple[str, ...]] = tuple(
    code for code, _, _ in SYSTEM_ROLE_CATALOGUE
)

# The role a self-service signup makes its signer: the only bundle holding `workspace:configure`.
BOOTSTRAP_ROLE_CODE: Final[str] = "OWNER"

# The permission each contacts route requires. Named here so the route declaration, the policy call
# and the tests cannot drift apart.
CONTACT_PERMISSIONS: Final[dict[str, str]] = {
    "read": "contacts:read",
    "manage": "contacts:manage",
}

# The permission that administers people. Its removal from the last holder is refused
# (`LAST_ADMINISTRATOR`), so a workspace can never lock itself out.
ADMINISTRATION_PERMISSION: Final[str] = "users:manage"

USERS_ROLES_PERMISSIONS: Final[dict[str, str]] = {
    "list_roles": ADMINISTRATION_PERMISSION,
    "list_permissions": ADMINISTRATION_PERMISSION,
    "read_user_roles": ADMINISTRATION_PERMISSION,
    "read_user_permissions": ADMINISTRATION_PERMISSION,
    "assign_role": ADMINISTRATION_PERMISSION,
    "revoke_role": ADMINISTRATION_PERMISSION,
    "list_staff": ADMINISTRATION_PERMISSION,
    "invite_staff": ADMINISTRATION_PERMISSION,
    # Re-sending an invitation is re-inviting the person: the same permission, and the same
    # grantability check over the roles they hold.
    "resend_invitation": ADMINISTRATION_PERMISSION,
}

# The refusal when a change would leave the workspace with nobody holding `users:manage`.
LAST_ADMINISTRATOR: Final[str] = "LAST_ADMINISTRATOR"

# The permission each workspace (tenancy) route requires.
TENANCY_PERMISSIONS: Final[dict[str, str]] = {
    "read": "workspace:read",
    "configure": "workspace:configure",
}

USERS_ROLES_AUDIT_ACTIONS: Final[dict[str, str]] = {
    "assign_role": "ROLE_ASSIGNED",
    "revoke_role": "ROLE_REVOKED",
}

# The permission the audit read API requires.
AUDIT_READ_PERMISSION: Final[str] = "audit:read"

# The audit action a role grant **and** a role revoke emit. This is doc 07 §1's name — the closed
# catalogue `docs/features/04-audit-log/05-data-and-audit.md` makes normative — and not the
# `ROLE_ASSIGNED`/`ROLE_REVOKED` pair `05-data-and-audit.md` lists, because `03-users-and-roles/05`
# records that conflict as OPEN-1 (*"one naming authority must be chosen before the writer is built"*)
# and only doc 07 §1 is the closed vocabulary: *"No new action name may be invented."* Which of the two
# happened is in the payload's `change` key (`GRANT`, `REVOKE`, `NONE`), and this is recorded as a
# decision in the PR rather than left implicit.
USER_PERMISSION_CHANGE: Final[str] = "user.permission_change"

# The audit action a staff invitation emits: doc 07 §1's `user.create`, the closed catalogue's name
# for `05-data-and-audit.md`'s `USER_CREATED` row (the same OPEN-1 naming decision as above). A
# refused invitation writes it with `result = DENIED` and one of the reason codes below.
USER_CREATE: Final[str] = "user.create"

# Refusal reasons for a staff invitation, in the same `{code, message}` envelope as every other denial.
# `EMAIL_UNAVAILABLE` is the one answer for an address that already has an account, in this
# organisation or in any other: it never says which, so the refusal discloses no tenant
# (`docs/features/03-users-and-roles/04-threat-model.md` T-03.8).
EMAIL_UNAVAILABLE: Final[str] = "EMAIL_UNAVAILABLE"
# Recorded (never returned) when a client put a `tenant_id` in the request: it is ignored, the
# invitation lands in the session's tenant, and the attempt is audited (INV-1).
CLIENT_TENANT_ID_IGNORED: Final[str] = "CLIENT_TENANT_ID_IGNORED"
# The one answer for an invitation link that is unknown, tampered with, expired or already used.
INVITATION_INVALID: Final[str] = "INVITATION_INVALID"
# Inviting needs outgoing mail: the invitee sets their own password through the emailed link, so an
# invitation that cannot be sent is refused before anything is written.
EMAIL_NOT_CONFIGURED: Final[str] = "EMAIL_NOT_CONFIGURED"
# A resend for someone whose status is not `INVITED`: they accepted (or set a password another way),
# were never invited, or are deactivated. Nothing is sent and no password is touched.
INVITATION_NOT_PENDING: Final[str] = "INVITATION_NOT_PENDING"
# The `change` a resend carries on its `user.create` event, which is what tells it apart from the
# account's creation (`05-data-and-audit.md`, "Resend").
INVITATION_RESENT: Final[str] = "INVITATION_RESENT"
# The one answer for an workspace-signup link that is tampered with, expired, replaced by a
# resend, already used, or whose address has an account by now (D-008).
SIGNUP_LINK_INVALID: Final[str] = "SIGNUP_LINK_INVALID"

# The permission each appointments route requires. A booking belongs to a contact, so reading the
# calendar is `contacts:read` and booking, or moving a booking through its states, is
# `contacts:manage`.
APPOINTMENT_PERMISSIONS: Final[dict[str, str]] = {
    "read": CONTACT_PERMISSIONS["read"],
    "write": CONTACT_PERMISSIONS["manage"],
}

# The system roles whose holders can be booked (the built-in booking connector), and the practitioner
# role each implies. Every role is bookable: a small business's owner usually takes bookings too.
PRACTITIONER_ROLE_BY_CODE: Final[dict[str, str]] = {
    "OWNER": "STAFF",
    "ADMIN": "STAFF",
    "AGENT": "STAFF",
}
