"""Workspace settings and setup checklist shapes."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.modules.practice.models import MIN_RETENTION_YEARS


class PracticeSettingsRead(BaseModel):
    retention_years: int
    #: `None` until the settings were first saved (the setup step stays undone).
    updated_at: datetime | None


class PracticeSettingsUpdate(BaseModel):
    """Unknown fields are refused (a `tenant_id` included)."""

    model_config = ConfigDict(extra="forbid")

    retention_years: int = Field(ge=MIN_RETENTION_YEARS, le=100)


StepKey = Literal[
    "workspace_name",
    "hours",
    "team_invited",
    "settings",
    "permissions_reviewed",
    "booking_page",
    "integrations",
]


class SetupStep(BaseModel):
    key: StepKey
    status: Literal["done", "todo", "optional", "informational"]
    required: bool


class SetupRead(BaseModel):
    """The setup checklist (R1-R3), every step derived from live data."""

    steps: list[SetupStep]
    required_done: int
    required_total: int
    ready: bool
