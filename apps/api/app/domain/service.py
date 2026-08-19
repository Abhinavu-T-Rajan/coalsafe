"""COALSAFE Domain Ontology — Reusable Query Functions.

These functions query actual database state. They never fabricate values.
If there are no records, they return empty collections or appropriate empty-state responses.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.domain.models import AuditEvent, Equipment, Handover, Hazard, Incident, Mine, MineArea, Person, Shift
from app.domain.schemas import AreaContext, MineAreaResponse, MineContext, MineResponse

# ---------------------------------------------------------------------------
# Mine Functions
# ---------------------------------------------------------------------------


def get_mine_context(mine_id: str, db: Session) -> Optional[MineContext]:
    """Returns aggregated context for a mine.

    Returns None if the mine does not exist.
    All counts are real database values — never fabricated.
    """
    mine = db.get(Mine, mine_id)
    if not mine:
        return None

    area_count = db.scalar(select(func.count()).where(MineArea.mine_id == mine_id)) or 0
    people_count = db.scalar(select(func.count()).where(Person.mine_id == mine_id)) or 0
    equipment_count = db.scalar(select(func.count()).where(Equipment.mine_id == mine_id)) or 0
    shift_count = db.scalar(select(func.count()).where(Shift.mine_id == mine_id)) or 0
    open_hazard_count = db.scalar(
        select(func.count()).where(Hazard.mine_id == mine_id, Hazard.status.in_(["OPEN", "ASSIGNED"]))
    ) or 0
    open_incident_count = db.scalar(
        select(func.count()).where(Incident.mine_id == mine_id, Incident.status.in_(["OPEN", "INVESTIGATING"]))
    ) or 0

    return MineContext(
        mine=MineResponse.model_validate(mine),
        area_count=area_count,
        people_count=people_count,
        equipment_count=equipment_count,
        shift_count=shift_count,
        open_hazard_count=open_hazard_count,
        open_incident_count=open_incident_count,
    )


# ---------------------------------------------------------------------------
# Area Functions
# ---------------------------------------------------------------------------


def get_area_context(area_id: str, db: Session) -> Optional[AreaContext]:
    """Returns aggregated context for a mine area.

    Returns None if the area does not exist.
    """
    area = db.get(MineArea, area_id)
    if not area:
        return None

    equipment_count = db.scalar(select(func.count()).where(Equipment.area_id == area_id)) or 0
    open_hazard_count = db.scalar(
        select(func.count()).where(Hazard.area_id == area_id, Hazard.status.in_(["OPEN", "ASSIGNED"]))
    ) or 0
    open_incident_count = db.scalar(
        select(func.count()).where(Incident.area_id == area_id, Incident.status.in_(["OPEN", "INVESTIGATING"]))
    ) or 0

    return AreaContext(
        area=MineAreaResponse.model_validate(area),
        equipment_count=equipment_count,
        open_hazard_count=open_hazard_count,
        open_incident_count=open_incident_count,
    )


# ---------------------------------------------------------------------------
# Hazard Functions
# ---------------------------------------------------------------------------


def get_active_hazards(db: Session, mine_id: Optional[str] = None, area_id: Optional[str] = None) -> list[Hazard]:
    """Returns active hazards. Returns [] when there are none — never fabricates values."""
    stmt = select(Hazard).where(Hazard.status.in_(["OPEN", "ASSIGNED"]))
    if mine_id:
        stmt = stmt.where(Hazard.mine_id == mine_id)
    if area_id:
        stmt = stmt.where(Hazard.area_id == area_id)
    return list(db.scalars(stmt).all())


# ---------------------------------------------------------------------------
# Incident Functions
# ---------------------------------------------------------------------------


def get_active_incidents(db: Session, mine_id: Optional[str] = None, area_id: Optional[str] = None) -> list[Incident]:
    """Returns active incidents. Returns [] when there are none — never fabricates values."""
    stmt = select(Incident).where(Incident.status.in_(["OPEN", "INVESTIGATING"]))
    if mine_id:
        stmt = stmt.where(Incident.mine_id == mine_id)
    if area_id:
        stmt = stmt.where(Incident.area_id == area_id)
    return list(db.scalars(stmt).all())


# ---------------------------------------------------------------------------
# Equipment Functions
# ---------------------------------------------------------------------------


def get_equipment_status(db: Session, mine_id: Optional[str] = None, area_id: Optional[str] = None) -> list[Equipment]:
    """Returns equipment list. Returns [] when there is none."""
    stmt = select(Equipment)
    if mine_id:
        stmt = stmt.where(Equipment.mine_id == mine_id)
    if area_id:
        stmt = stmt.where(Equipment.area_id == area_id)
    return list(db.scalars(stmt).all())


# ---------------------------------------------------------------------------
# Shift Functions
# ---------------------------------------------------------------------------


def get_shift_briefing(shift_id: str, db: Session) -> Optional[dict]:
    """Returns briefing data for a shift: shift details + its handovers + active hazards.

    Returns None if the shift does not exist.
    """
    shift = db.get(Shift, shift_id)
    if not shift:
        return None

    handovers = list(db.scalars(select(Handover).where(Handover.shift_id == shift_id)).all())
    active_hazards = get_active_hazards(db, mine_id=shift.mine_id, area_id=shift.area_id)

    return {
        "shift_id": shift_id,
        "shift_type": shift.shift_type,
        "start_time": shift.start_time,
        "end_time": shift.end_time,
        "status": shift.status,
        "handover_count": len(handovers),
        "active_hazard_count": len(active_hazards),
    }


# ---------------------------------------------------------------------------
# Audit Functions
# ---------------------------------------------------------------------------


def create_audit_event(
    db: Session,
    action_type: str,
    target_object_type: str,
    target_object_id: str,
    actor_id: Optional[str] = None,
    metadata: Optional[dict] = None,
) -> AuditEvent:
    """Creates and persists an audit event.

    Only called as a result of actual application actions — never seeded.
    """
    event = AuditEvent(
        actor_id=actor_id,
        action_type=action_type,
        target_object_type=target_object_type,
        target_object_id=target_object_id,
        timestamp=datetime.utcnow(),
        metadata_=metadata,
    )
    db.add(event)
    db.flush()  # assign id without committing (caller commits)
    return event
