"""COALSAFE Domain Ontology — Pydantic v2 Schemas.

Request and response schemas for all domain objects.
"""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Mine Schemas
# ---------------------------------------------------------------------------


class MineCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=64)
    location: str = Field(..., min_length=1, max_length=512)
    status: str = Field(default="ACTIVE")


class MineResponse(BaseModel):
    id: str
    name: str
    code: str
    location: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MineContext(BaseModel):
    """Aggregated context for a mine — no values fabricated."""
    mine: MineResponse
    area_count: int
    people_count: int
    equipment_count: int
    shift_count: int
    open_hazard_count: int
    open_incident_count: int


# ---------------------------------------------------------------------------
# MineArea Schemas
# ---------------------------------------------------------------------------


class MineAreaCreate(BaseModel):
    mine_id: str
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=64)
    description: Optional[str] = None
    status: str = Field(default="ACTIVE")


class MineAreaResponse(BaseModel):
    id: str
    mine_id: str
    name: str
    code: str
    description: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AreaContext(BaseModel):
    """Aggregated context for a mine area — no values fabricated."""
    area: MineAreaResponse
    equipment_count: int
    open_hazard_count: int
    open_incident_count: int


# ---------------------------------------------------------------------------
# Person Schemas
# ---------------------------------------------------------------------------


class PersonCreate(BaseModel):
    mine_id: str
    name: str = Field(..., min_length=1, max_length=255)
    employee_id: str = Field(..., min_length=1, max_length=64)
    role: str = Field(..., min_length=1, max_length=128)
    contact_information: Optional[str] = None
    status: str = Field(default="ACTIVE")


class PersonResponse(BaseModel):
    id: str
    mine_id: str
    name: str
    employee_id: str
    role: str
    contact_information: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Equipment Schemas
# ---------------------------------------------------------------------------


class EquipmentCreate(BaseModel):
    mine_id: str
    area_id: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=255)
    equipment_code: str = Field(..., min_length=1, max_length=64)
    equipment_type: str = Field(..., min_length=1, max_length=128)
    status: str = Field(default="OPERATIONAL")


class EquipmentResponse(BaseModel):
    id: str
    mine_id: str
    area_id: Optional[str]
    name: str
    equipment_code: str
    equipment_type: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Shift Schemas
# ---------------------------------------------------------------------------


class ShiftCreate(BaseModel):
    mine_id: str
    area_id: Optional[str] = None
    supervisor_id: Optional[str] = None
    shift_type: str = Field(..., description="MORNING / AFTERNOON / NIGHT")
    start_time: str = Field(..., description="ISO 8601 datetime string")
    end_time: Optional[str] = None
    status: str = Field(default="SCHEDULED")


class ShiftResponse(BaseModel):
    id: str
    mine_id: str
    area_id: Optional[str]
    supervisor_id: Optional[str]
    shift_type: str
    start_time: str
    end_time: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Handover Schemas
# ---------------------------------------------------------------------------


class HandoverCreate(BaseModel):
    shift_id: str
    created_by: Optional[str] = None
    summary: Optional[str] = None
    production_information: Optional[str] = None
    equipment_information: Optional[str] = None
    safety_information: Optional[str] = None
    red_flags: list[dict[str, Any]] = Field(default_factory=list)
    required_actions: list[str] = Field(default_factory=list)


class HandoverResponse(BaseModel):
    id: str
    shift_id: str
    created_by: Optional[str]
    summary: Optional[str]
    production_information: Optional[str]
    equipment_information: Optional[str]
    safety_information: Optional[str]
    red_flags: Optional[list[dict[str, Any]]]
    required_actions: Optional[list[str]]
    status: str
    submitted_at: Optional[datetime]
    acknowledged_at: Optional[datetime]
    sha256_hash: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class SubmitHandoverRequest(BaseModel):
    actor_id: Optional[str] = None


class AcknowledgeHandoverRequest(BaseModel):
    actor_id: Optional[str] = None
    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Hazard Schemas
# ---------------------------------------------------------------------------


class HazardCreate(BaseModel):
    mine_id: str
    area_id: Optional[str] = None
    reported_by: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(..., description="STRATA_CONTROL / MINE_GAS_VENTILATION / FIRE_EXPLOSION / etc.")
    severity: str = Field(default="MEDIUM", description="LOW / MEDIUM / HIGH / CRITICAL")
    location: Optional[str] = None
    detected_at: Optional[datetime] = None


class HazardResponse(BaseModel):
    id: str
    mine_id: str
    area_id: Optional[str]
    reported_by: Optional[str]
    assigned_to: Optional[str]
    title: str
    description: Optional[str]
    category: str
    severity: str
    status: str
    location: Optional[str]
    detected_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CloseHazardRequest(BaseModel):
    actor_id: Optional[str] = None
    resolution_notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Incident Schemas
# ---------------------------------------------------------------------------


class IncidentCreate(BaseModel):
    mine_id: str
    area_id: Optional[str] = None
    reported_by: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    type: str = Field(..., description="SAFETY / OPERATIONAL / ENVIRONMENTAL")
    severity: str = Field(default="MEDIUM", description="LOW / MEDIUM / HIGH / CRITICAL")
    location: Optional[str] = None
    occurred_at: Optional[datetime] = None


class IncidentResponse(BaseModel):
    id: str
    mine_id: str
    area_id: Optional[str]
    reported_by: Optional[str]
    title: str
    description: Optional[str]
    type: str
    severity: str
    status: str
    occurred_at: Optional[datetime]
    location: Optional[str]
    resolved_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class ResolveIncidentRequest(BaseModel):
    actor_id: Optional[str] = None
    resolution_notes: Optional[str] = None


# ---------------------------------------------------------------------------
# AuditEvent Schema
# ---------------------------------------------------------------------------


class AuditEventResponse(BaseModel):
    id: str
    actor_id: Optional[str]
    action_type: str
    target_object_type: str
    target_object_id: str
    timestamp: datetime
    metadata: Optional[dict[str, Any]] = Field(None, validation_alias="metadata_")

    model_config = {"from_attributes": True, "populate_by_name": True}
