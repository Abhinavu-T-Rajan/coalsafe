"""COALSAFE Domain Ontology — FastAPI Router.

All endpoints query real database state.
Empty collections are returned when no records exist.
No domain records are created automatically.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.domain import actions as domain_actions
from app.domain import service as domain_service
from app.domain.models import (
    AuditEvent,
    Equipment,
    Handover,
    Hazard,
    Incident,
    Mine,
    MineArea,
    Person,
    Shift,
)
from app.domain.schemas import (
    AcknowledgeHandoverRequest,
    AreaContext,
    AuditEventResponse,
    CloseHazardRequest,
    EquipmentCreate,
    EquipmentResponse,
    HandoverCreate,
    HandoverResponse,
    HazardCreate,
    HazardResponse,
    IncidentCreate,
    IncidentResponse,
    MineAreaCreate,
    MineAreaResponse,
    MineContext,
    MineCreate,
    MineResponse,
    PersonCreate,
    PersonResponse,
    ResolveIncidentRequest,
    ShiftCreate,
    ShiftResponse,
    SubmitHandoverRequest,
)

router = APIRouter(prefix="/ontology", tags=["Domain Ontology"])


# ===========================================================================
# MINES
# ===========================================================================


@router.get(
    "/mines",
    response_model=list[MineResponse],
    summary="List all mines",
)
def list_mines(db: Session = Depends(get_db)) -> list[MineResponse]:
    """Returns all mines. Returns [] when no mines have been created."""
    mines = list(db.scalars(select(Mine)).all())
    return [MineResponse.model_validate(m) for m in mines]


@router.post(
    "/mines",
    response_model=MineResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a mine",
)
def create_mine(payload: MineCreate, db: Session = Depends(get_db)) -> MineResponse:
    """Creates a new mine. No mines are created automatically."""
    mine = Mine(
        name=payload.name,
        code=payload.code,
        location=payload.location,
        status=payload.status,
    )
    db.add(mine)
    db.commit()
    db.refresh(mine)
    return MineResponse.model_validate(mine)


@router.get(
    "/mines/{mine_id}",
    response_model=MineResponse,
    summary="Get a mine by ID",
)
def get_mine(mine_id: str, db: Session = Depends(get_db)) -> MineResponse:
    mine = db.get(Mine, mine_id)
    if not mine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Mine '{mine_id}' not found.")
    return MineResponse.model_validate(mine)


@router.get(
    "/mines/{mine_id}/context",
    response_model=MineContext,
    summary="Get mine context (aggregated data)",
)
def get_mine_context(mine_id: str, db: Session = Depends(get_db)) -> MineContext:
    """Returns aggregated context for a mine including real counts of areas, people, equipment, etc."""
    ctx = domain_service.get_mine_context(mine_id, db)
    if not ctx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Mine '{mine_id}' not found.")
    return ctx


# ===========================================================================
# MINE AREAS
# ===========================================================================


@router.get(
    "/mines/{mine_id}/areas",
    response_model=list[MineAreaResponse],
    summary="List areas for a mine",
)
def list_areas(mine_id: str, db: Session = Depends(get_db)) -> list[MineAreaResponse]:
    """Returns all areas for a mine. Returns [] when no areas exist."""
    areas = list(db.scalars(select(MineArea).where(MineArea.mine_id == mine_id)).all())
    return [MineAreaResponse.model_validate(a) for a in areas]


@router.post(
    "/mines/{mine_id}/areas",
    response_model=MineAreaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an area for a mine",
)
def create_area(mine_id: str, payload: MineAreaCreate, db: Session = Depends(get_db)) -> MineAreaResponse:
    mine = db.get(Mine, mine_id)
    if not mine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Mine '{mine_id}' not found.")
    area = MineArea(
        mine_id=mine_id,
        name=payload.name,
        code=payload.code,
        description=payload.description,
        status=payload.status,
    )
    db.add(area)
    db.commit()
    db.refresh(area)
    return MineAreaResponse.model_validate(area)


@router.get(
    "/areas/{area_id}",
    response_model=MineAreaResponse,
    summary="Get an area by ID",
)
def get_area(area_id: str, db: Session = Depends(get_db)) -> MineAreaResponse:
    area = db.get(MineArea, area_id)
    if not area:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Area '{area_id}' not found.")
    return MineAreaResponse.model_validate(area)


@router.get(
    "/areas/{area_id}/context",
    response_model=AreaContext,
    summary="Get area context (aggregated data)",
)
def get_area_context(area_id: str, db: Session = Depends(get_db)) -> AreaContext:
    ctx = domain_service.get_area_context(area_id, db)
    if not ctx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Area '{area_id}' not found.")
    return ctx


# ===========================================================================
# PEOPLE
# ===========================================================================


@router.get(
    "/mines/{mine_id}/people",
    response_model=list[PersonResponse],
    summary="List people for a mine",
)
def list_people(mine_id: str, db: Session = Depends(get_db)) -> list[PersonResponse]:
    people = list(db.scalars(select(Person).where(Person.mine_id == mine_id)).all())
    return [PersonResponse.model_validate(p) for p in people]


@router.post(
    "/mines/{mine_id}/people",
    response_model=PersonResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a person to a mine",
)
def create_person(mine_id: str, payload: PersonCreate, db: Session = Depends(get_db)) -> PersonResponse:
    mine = db.get(Mine, mine_id)
    if not mine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Mine '{mine_id}' not found.")
    person = Person(
        mine_id=mine_id,
        name=payload.name,
        employee_id=payload.employee_id,
        role=payload.role,
        contact_information=payload.contact_information,
        status=payload.status,
    )
    db.add(person)
    db.commit()
    db.refresh(person)
    return PersonResponse.model_validate(person)


# ===========================================================================
# EQUIPMENT
# ===========================================================================


@router.get(
    "/mines/{mine_id}/equipment",
    response_model=list[EquipmentResponse],
    summary="List equipment for a mine",
)
def list_equipment(mine_id: str, area_id: Optional[str] = None, db: Session = Depends(get_db)) -> list[EquipmentResponse]:
    equipment = domain_service.get_equipment_status(db, mine_id=mine_id, area_id=area_id)
    return [EquipmentResponse.model_validate(e) for e in equipment]


@router.post(
    "/mines/{mine_id}/equipment",
    response_model=EquipmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add equipment to a mine",
)
def create_equipment(mine_id: str, payload: EquipmentCreate, db: Session = Depends(get_db)) -> EquipmentResponse:
    mine = db.get(Mine, mine_id)
    if not mine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Mine '{mine_id}' not found.")
    eq = Equipment(
        mine_id=mine_id,
        area_id=payload.area_id,
        name=payload.name,
        equipment_code=payload.equipment_code,
        equipment_type=payload.equipment_type,
        status=payload.status,
    )
    db.add(eq)
    db.commit()
    db.refresh(eq)
    return EquipmentResponse.model_validate(eq)


# ===========================================================================
# SHIFTS
# ===========================================================================


@router.get(
    "/mines/{mine_id}/shifts",
    response_model=list[ShiftResponse],
    summary="List shifts for a mine",
)
def list_shifts(mine_id: str, db: Session = Depends(get_db)) -> list[ShiftResponse]:
    shifts = list(db.scalars(select(Shift).where(Shift.mine_id == mine_id)).all())
    return [ShiftResponse.model_validate(s) for s in shifts]


@router.post(
    "/mines/{mine_id}/shifts",
    response_model=ShiftResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a shift for a mine",
)
def create_shift(mine_id: str, payload: ShiftCreate, db: Session = Depends(get_db)) -> ShiftResponse:
    mine = db.get(Mine, mine_id)
    if not mine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Mine '{mine_id}' not found.")
    shift = Shift(
        mine_id=mine_id,
        area_id=payload.area_id,
        supervisor_id=payload.supervisor_id,
        shift_type=payload.shift_type,
        start_time=payload.start_time,
        end_time=payload.end_time,
        status=payload.status,
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return ShiftResponse.model_validate(shift)


# ===========================================================================
# HANDOVERS
# ===========================================================================


@router.get(
    "/mines/{mine_id}/handovers",
    response_model=list[HandoverResponse],
    summary="List handovers for a mine's shifts",
)
def list_handovers(mine_id: str, db: Session = Depends(get_db)) -> list[HandoverResponse]:
    shifts = list(db.scalars(select(Shift).where(Shift.mine_id == mine_id)).all())
    shift_ids = [s.id for s in shifts]
    if not shift_ids:
        return []
    handovers = list(db.scalars(select(Handover).where(Handover.shift_id.in_(shift_ids))).all())
    return [HandoverResponse.model_validate(h) for h in handovers]


@router.post(
    "/shifts/{shift_id}/handovers",
    response_model=HandoverResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a handover for a shift",
)
def create_handover(shift_id: str, payload: HandoverCreate, db: Session = Depends(get_db)) -> HandoverResponse:
    shift = db.get(Shift, shift_id)
    if not shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Shift '{shift_id}' not found.")
    handover = Handover(
        shift_id=shift_id,
        created_by=payload.created_by,
        summary=payload.summary,
        production_information=payload.production_information,
        equipment_information=payload.equipment_information,
        safety_information=payload.safety_information,
        red_flags=payload.red_flags,
        required_actions=payload.required_actions,
        status="DRAFT",
    )
    db.add(handover)
    db.commit()
    db.refresh(handover)
    return HandoverResponse.model_validate(handover)


@router.post(
    "/handovers/{handover_id}/submit",
    response_model=HandoverResponse,
    summary="Submit a handover (domain action)",
)
def submit_handover(handover_id: str, payload: SubmitHandoverRequest, db: Session = Depends(get_db)) -> HandoverResponse:
    result = domain_actions.submit_handover(handover_id, db, actor_id=payload.actor_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Handover '{handover_id}' not found.")
    return HandoverResponse.model_validate(result)


@router.post(
    "/handovers/{handover_id}/acknowledge",
    response_model=HandoverResponse,
    summary="Acknowledge a handover (domain action)",
)
def acknowledge_handover(handover_id: str, payload: AcknowledgeHandoverRequest, db: Session = Depends(get_db)) -> HandoverResponse:
    result = domain_actions.acknowledge_handover(handover_id, db, actor_id=payload.actor_id, notes=payload.notes)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Handover '{handover_id}' not found.")
    return HandoverResponse.model_validate(result)


# ===========================================================================
# HAZARDS
# ===========================================================================


@router.get(
    "/hazards",
    response_model=list[HazardResponse],
    summary="List hazards",
)
def list_hazards(mine_id: Optional[str] = None, area_id: Optional[str] = None, db: Session = Depends(get_db)) -> list[HazardResponse]:
    """Returns all hazards. Optionally filter by mine or area. Returns [] when none exist."""
    stmt = select(Hazard)
    if mine_id:
        stmt = stmt.where(Hazard.mine_id == mine_id)
    if area_id:
        stmt = stmt.where(Hazard.area_id == area_id)
    hazards = list(db.scalars(stmt).all())
    return [HazardResponse.model_validate(h) for h in hazards]


@router.post(
    "/hazards",
    response_model=HazardResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Report a hazard",
)
def report_hazard(payload: HazardCreate, db: Session = Depends(get_db)) -> HazardResponse:
    """Reports a new hazard and creates an audit event."""
    hazard = Hazard(
        mine_id=payload.mine_id,
        area_id=payload.area_id,
        reported_by=payload.reported_by,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        severity=payload.severity,
        status="OPEN",
        location=payload.location,
        detected_at=payload.detected_at,
    )
    db.add(hazard)
    db.flush()

    domain_service.create_audit_event(
        db=db,
        action_type="REPORT_HAZARD",
        target_object_type="Hazard",
        target_object_id=hazard.id,
        actor_id=payload.reported_by,
        metadata={"title": payload.title, "severity": payload.severity},
    )

    db.commit()
    db.refresh(hazard)
    return HazardResponse.model_validate(hazard)


@router.get(
    "/hazards/{hazard_id}",
    response_model=HazardResponse,
    summary="Get a hazard by ID",
)
def get_hazard(hazard_id: str, db: Session = Depends(get_db)) -> HazardResponse:
    hazard = db.get(Hazard, hazard_id)
    if not hazard:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Hazard '{hazard_id}' not found.")
    return HazardResponse.model_validate(hazard)


@router.post(
    "/hazards/{hazard_id}/close",
    response_model=HazardResponse,
    summary="Close a hazard (domain action)",
)
def close_hazard(hazard_id: str, payload: CloseHazardRequest, db: Session = Depends(get_db)) -> HazardResponse:
    result = domain_actions.close_hazard(hazard_id, db, actor_id=payload.actor_id, resolution_notes=payload.resolution_notes)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Hazard '{hazard_id}' not found.")
    return HazardResponse.model_validate(result)


# ===========================================================================
# INCIDENTS
# ===========================================================================


@router.get(
    "/incidents",
    response_model=list[IncidentResponse],
    summary="List incidents",
)
def list_incidents(mine_id: Optional[str] = None, area_id: Optional[str] = None, db: Session = Depends(get_db)) -> list[IncidentResponse]:
    """Returns all incidents. Returns [] when none exist."""
    stmt = select(Incident)
    if mine_id:
        stmt = stmt.where(Incident.mine_id == mine_id)
    if area_id:
        stmt = stmt.where(Incident.area_id == area_id)
    incidents = list(db.scalars(stmt).all())
    return [IncidentResponse.model_validate(i) for i in incidents]


@router.post(
    "/incidents",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an incident",
)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)) -> IncidentResponse:
    """Creates an incident and records an audit event."""
    incident = Incident(
        mine_id=payload.mine_id,
        area_id=payload.area_id,
        reported_by=payload.reported_by,
        title=payload.title,
        description=payload.description,
        type=payload.type,
        severity=payload.severity,
        status="OPEN",
        occurred_at=payload.occurred_at,
        location=payload.location,
    )
    db.add(incident)
    db.flush()

    domain_service.create_audit_event(
        db=db,
        action_type="CREATE_INCIDENT",
        target_object_type="Incident",
        target_object_id=incident.id,
        actor_id=payload.reported_by,
        metadata={"title": payload.title, "severity": payload.severity},
    )

    db.commit()
    db.refresh(incident)
    return IncidentResponse.model_validate(incident)


@router.get(
    "/incidents/{incident_id}",
    response_model=IncidentResponse,
    summary="Get an incident by ID",
)
def get_incident(incident_id: str, db: Session = Depends(get_db)) -> IncidentResponse:
    incident = db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Incident '{incident_id}' not found.")
    return IncidentResponse.model_validate(incident)


@router.post(
    "/incidents/{incident_id}/resolve",
    response_model=IncidentResponse,
    summary="Resolve an incident (domain action)",
)
def resolve_incident(incident_id: str, payload: ResolveIncidentRequest, db: Session = Depends(get_db)) -> IncidentResponse:
    result = domain_actions.resolve_incident(incident_id, db, actor_id=payload.actor_id, resolution_notes=payload.resolution_notes)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Incident '{incident_id}' not found.")
    return IncidentResponse.model_validate(result)


# ===========================================================================
# AUDIT EVENTS
# ===========================================================================


@router.get(
    "/audit-events",
    response_model=list[AuditEventResponse],
    summary="List audit events",
)
def list_audit_events(
    target_object_type: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> list[AuditEventResponse]:
    """Returns the audit trail. Returns [] on a fresh system with no actions taken."""
    stmt = select(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(limit)
    if target_object_type:
        stmt = stmt.where(AuditEvent.target_object_type == target_object_type)
    events = list(db.scalars(stmt).all())
    return [AuditEventResponse.model_validate(e) for e in events]
