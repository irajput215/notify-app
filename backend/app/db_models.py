"""The model registry.

Alembic reads `SQLModel.metadata`, so every table must be imported somewhere on
that path. This module is that single place: `alembic/env.py` imports it, and
nothing else has to remember to import a model for its table to exist.

Importing it also applies the naming convention from `app.core.metadata` before
any table is defined.
"""

from sqlmodel import SQLModel

from app.core.metadata import NAMING_CONVENTION, index_foreign_keys
from app.models import User
from app.modules.appointments.models import (
    Appointment,
    AppointmentHours,
    AppointmentNotification,
    AppointmentSettings,
)
from app.modules.audit.models import AuditLogEntry
from app.modules.contacts.models import Contact
from app.modules.identity_tenancy.models import StepUpGrant, Tenant
from app.modules.locations.models import Location
from app.modules.practice.models import TenantSettings
from app.modules.users_roles.models import (
    Permission,
    Role,
    RolePermission,
    SignupRequest,
    StaffInvitation,
    UserRole,
)

# Every foreign key gets an index (see `index_foreign_keys`); after every model is imported.
index_foreign_keys(SQLModel.metadata)

__all__ = [
    "NAMING_CONVENTION",
    "SQLModel",
    "Appointment",
    "AppointmentHours",
    "AppointmentNotification",
    "AppointmentSettings",
    "AuditLogEntry",
    "Location",
    "Contact",
    "Permission",
    "Role",
    "RolePermission",
    "SignupRequest",
    "StaffInvitation",
    "StepUpGrant",
    "Tenant",
    "TenantSettings",
    "User",
    "UserRole",
]
