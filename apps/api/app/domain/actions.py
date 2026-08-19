"""COALSAFE Domain Ontology — Domain Actions.

Actions are explicit application-level operations that:
1. Update the target domain object
2. Create an AuditEvent
3. Optionally update related objects

These are NOT arbitrary database updates — they model real operational decisions.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.domain.models import DomainAction, Handover, Hazard, Incident
from app.domain.service import create_audit_event

# ---------------------------------------------------------------------------
# Handover Actions
# ---------------------------------------------------------------------------


def submit_handover(handover_id: str, db: Session, actor_id: Optional[str] = None) -> Optional[Handover]:
    """Submits a handover for incoming supervisor acknowledgment.

    Updates: Handover.status = SUBMITTED, Handover.submitted_at
    Creates: AuditEvent (SUBMIT_HANDOVER)
    """
    handover = db.get(Handover, handover_id)
    if not handover:
        return None

    handover.status = "SUBMITTED"
    handover.submitted_at = datetime.utcnow()

    create_audit_event(
        db=db,
        action_type="SUBMIT_HANDOVER",
        target_object_type="Handover",
        target_object_id=handover_id,
        actor_id=actor_id,
        metadata={"previous_status": "DRAFT"},
    )

    action = DomainAction(
        type="SUBMIT_HANDOVER",
        actor_id=actor_id,
        target_object_type="Handover",
        target_object_id=handover_id,
        status="COMPLETED",
        metadata_=None,
    )
    db.add(action)
    db.commit()
    db.refresh(handover)
    return handover


def acknowledge_handover(
    handover_id: str,
    db: Session,
    actor_id: Optional[str] = None,
    notes: Optional[str] = None,
) -> Optional[Handover]:
    """Acknowledges a submitted handover.

    Updates: Handover.status = ACKNOWLEDGED, Handover.acknowledged_at
    Creates: AuditEvent (ACKNOWLEDGE_HANDOVER)
    """
    handover = db.get(Handover, handover_id)
    if not handover:
        return None

    handover.status = "ACKNOWLEDGED"
    handover.acknowledged_at = datetime.utcnow()

    create_audit_event(
        db=db,
        action_type="ACKNOWLEDGE_HANDOVER",
        target_object_type="Handover",
        target_object_id=handover_id,
        actor_id=actor_id,
        metadata={"notes": notes},
    )

    action = DomainAction(
        type="ACKNOWLEDGE_HANDOVER",
        actor_id=actor_id,
        target_object_type="Handover",
        target_object_id=handover_id,
        status="COMPLETED",
        metadata_={"notes": notes},
    )
    db.add(action)
    db.commit()
    db.refresh(handover)
    return handover


# ---------------------------------------------------------------------------
# Hazard Actions
# ---------------------------------------------------------------------------


def close_hazard(
    hazard_id: str,
    db: Session,
    actor_id: Optional[str] = None,
    resolution_notes: Optional[str] = None,
) -> Optional[Hazard]:
    """Closes an open hazard after mitigation.

    Updates: Hazard.status = CLOSED
    Creates: AuditEvent (CLOSE_HAZARD)
    """
    hazard = db.get(Hazard, hazard_id)
    if not hazard:
        return None

    previous_status = hazard.status
    hazard.status = "CLOSED"
    hazard.updated_at = datetime.utcnow()

    create_audit_event(
        db=db,
        action_type="CLOSE_HAZARD",
        target_object_type="Hazard",
        target_object_id=hazard_id,
        actor_id=actor_id,
        metadata={"previous_status": previous_status, "resolution_notes": resolution_notes},
    )

    action = DomainAction(
        type="CLOSE_HAZARD",
        actor_id=actor_id,
        target_object_type="Hazard",
        target_object_id=hazard_id,
        status="COMPLETED",
        metadata_={"resolution_notes": resolution_notes},
    )
    db.add(action)
    db.commit()
    db.refresh(hazard)
    return hazard


# ---------------------------------------------------------------------------
# Incident Actions
# ---------------------------------------------------------------------------


def resolve_incident(
    incident_id: str,
    db: Session,
    actor_id: Optional[str] = None,
    resolution_notes: Optional[str] = None,
) -> Optional[Incident]:
    """Resolves an open incident.

    Updates: Incident.status = RESOLVED, Incident.resolved_at
    Creates: AuditEvent (RESOLVE_INCIDENT)
    """
    incident = db.get(Incident, incident_id)
    if not incident:
        return None

    previous_status = incident.status
    incident.status = "RESOLVED"
    incident.resolved_at = datetime.utcnow()

    create_audit_event(
        db=db,
        action_type="RESOLVE_INCIDENT",
        target_object_type="Incident",
        target_object_id=incident_id,
        actor_id=actor_id,
        metadata={"previous_status": previous_status, "resolution_notes": resolution_notes},
    )

    action = DomainAction(
        type="RESOLVE_INCIDENT",
        actor_id=actor_id,
        target_object_type="Incident",
        target_object_id=incident_id,
        status="COMPLETED",
        metadata_={"resolution_notes": resolution_notes},
    )
    db.add(action)
    db.commit()
    db.refresh(incident)
    return incident
