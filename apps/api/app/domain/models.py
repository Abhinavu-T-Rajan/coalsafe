"""COALSAFE Domain Ontology — SQLAlchemy ORM Models.

These models represent the core ontology objects. No records are created automatically.
Every object must be created through an API request, form, or administrative panel.
"""

import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def _new_uuid() -> str:
    return str(uuid.uuid4())


class Mine(Base):
    """A real coal mine.

    Relationships:
        Mine contains MineArea
        Mine employs Person
        Mine owns Equipment
    """

    __tablename__ = "mines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    location: Mapped[str] = mapped_column(String(512), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    areas: Mapped[list["MineArea"]] = relationship("MineArea", back_populates="mine", cascade="all, delete-orphan")
    people: Mapped[list["Person"]] = relationship("Person", back_populates="mine", cascade="all, delete-orphan")
    equipment: Mapped[list["Equipment"]] = relationship("Equipment", back_populates="mine", cascade="all, delete-orphan")
    shifts: Mapped[list["Shift"]] = relationship("Shift", back_populates="mine", cascade="all, delete-orphan")
    hazards: Mapped[list["Hazard"]] = relationship("Hazard", back_populates="mine", cascade="all, delete-orphan")
    incidents: Mapped[list["Incident"]] = relationship("Incident", back_populates="mine", cascade="all, delete-orphan")


class MineArea(Base):
    """An operational area or section within a mine."""

    __tablename__ = "mine_areas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    mine_id: Mapped[str] = mapped_column(String(36), ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    mine: Mapped["Mine"] = relationship("Mine", back_populates="areas")
    equipment: Mapped[list["Equipment"]] = relationship("Equipment", back_populates="area")
    shifts: Mapped[list["Shift"]] = relationship("Shift", back_populates="area")
    hazards: Mapped[list["Hazard"]] = relationship("Hazard", back_populates="area")
    incidents: Mapped[list["Incident"]] = relationship("Incident", back_populates="area")


class Person(Base):
    """A real person registered in COALSAFE."""

    __tablename__ = "people"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    mine_id: Mapped[str] = mapped_column(String(36), ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    employee_id: Mapped[str] = mapped_column(String(64), nullable=False)
    role: Mapped[str] = mapped_column(String(128), nullable=False)
    contact_information: Mapped[str | None] = mapped_column(String(512), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    mine: Mapped["Mine"] = relationship("Mine", back_populates="people")
    supervised_shifts: Mapped[list["Shift"]] = relationship("Shift", back_populates="supervisor", foreign_keys="Shift.supervisor_id")
    created_handovers: Mapped[list["Handover"]] = relationship("Handover", back_populates="created_by_person", foreign_keys="Handover.created_by")
    reported_hazards: Mapped[list["Hazard"]] = relationship("Hazard", back_populates="reported_by_person", foreign_keys="Hazard.reported_by")
    assigned_hazards: Mapped[list["Hazard"]] = relationship("Hazard", back_populates="assigned_to_person", foreign_keys="Hazard.assigned_to")
    reported_incidents: Mapped[list["Incident"]] = relationship("Incident", back_populates="reported_by_person", foreign_keys="Incident.reported_by")


class Equipment(Base):
    """Real mine equipment registered in COALSAFE."""

    __tablename__ = "equipment"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    mine_id: Mapped[str] = mapped_column(String(36), ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    area_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("mine_areas.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    equipment_code: Mapped[str] = mapped_column(String(64), nullable=False)
    equipment_type: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="OPERATIONAL")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    mine: Mapped["Mine"] = relationship("Mine", back_populates="equipment")
    area: Mapped["MineArea | None"] = relationship("MineArea", back_populates="equipment")


class Shift(Base):
    """An operational shift at a mine."""

    __tablename__ = "shifts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    mine_id: Mapped[str] = mapped_column(String(36), ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    area_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("mine_areas.id", ondelete="SET NULL"), nullable=True)
    supervisor_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("people.id", ondelete="SET NULL"), nullable=True)
    shift_type: Mapped[str] = mapped_column(String(64), nullable=False)
    start_time: Mapped[str] = mapped_column(String(32), nullable=False)
    end_time: Mapped[str | None] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="SCHEDULED")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    mine: Mapped["Mine"] = relationship("Mine", back_populates="shifts")
    area: Mapped["MineArea | None"] = relationship("MineArea", back_populates="shifts")
    supervisor: Mapped["Person | None"] = relationship("Person", back_populates="supervised_shifts", foreign_keys=[supervisor_id])
    handovers: Mapped[list["Handover"]] = relationship("Handover", back_populates="shift", cascade="all, delete-orphan")


class Handover(Base):
    """A real shift handover record."""

    __tablename__ = "handovers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    shift_id: Mapped[str] = mapped_column(String(36), ForeignKey("shifts.id", ondelete="CASCADE"), nullable=False)
    created_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("people.id", ondelete="SET NULL"), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    production_information: Mapped[str | None] = mapped_column(Text, nullable=True)
    equipment_information: Mapped[str | None] = mapped_column(Text, nullable=True)
    safety_information: Mapped[str | None] = mapped_column(Text, nullable=True)
    red_flags: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=list)
    required_actions: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=list)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="DRAFT")
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    sha256_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    shift: Mapped["Shift"] = relationship("Shift", back_populates="handovers")
    created_by_person: Mapped["Person | None"] = relationship("Person", back_populates="created_handovers", foreign_keys=[created_by])


class Hazard(Base):
    """An identified safety hazard at a mine."""

    __tablename__ = "hazards"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    mine_id: Mapped[str] = mapped_column(String(36), ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    area_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("mine_areas.id", ondelete="SET NULL"), nullable=True)
    reported_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("people.id", ondelete="SET NULL"), nullable=True)
    assigned_to: Mapped[str | None] = mapped_column(String(36), ForeignKey("people.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    severity: Mapped[str] = mapped_column(String(32), nullable=False, default="MEDIUM")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="OPEN")
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    detected_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    mine: Mapped["Mine"] = relationship("Mine", back_populates="hazards")
    area: Mapped["MineArea | None"] = relationship("MineArea", back_populates="hazards")
    reported_by_person: Mapped["Person | None"] = relationship("Person", back_populates="reported_hazards", foreign_keys=[reported_by])
    assigned_to_person: Mapped["Person | None"] = relationship("Person", back_populates="assigned_hazards", foreign_keys=[assigned_to])


class Incident(Base):
    """A real operational or safety incident."""

    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    mine_id: Mapped[str] = mapped_column(String(36), ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    area_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("mine_areas.id", ondelete="SET NULL"), nullable=True)
    reported_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("people.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    severity: Mapped[str] = mapped_column(String(32), nullable=False, default="MEDIUM")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="OPEN")
    occurred_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    mine: Mapped["Mine"] = relationship("Mine", back_populates="incidents")
    area: Mapped["MineArea | None"] = relationship("MineArea", back_populates="incidents")
    reported_by_person: Mapped["Person | None"] = relationship("Person", back_populates="reported_incidents", foreign_keys=[reported_by])


class DomainAction(Base):
    """An explicit domain action affecting one or more domain objects.

    Types: SUBMIT_HANDOVER, ACKNOWLEDGE_HANDOVER, REPORT_HAZARD, CLOSE_HAZARD,
           RESOLVE_INCIDENT, ASSIGN_HAZARD, START_SHIFT, STOP_EQUIPMENT
    """

    __tablename__ = "domain_actions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    actor_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("people.id", ondelete="SET NULL"), nullable=True)
    target_object_type: Mapped[str] = mapped_column(String(64), nullable=False)
    target_object_id: Mapped[str] = mapped_column(String(36), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="COMPLETED")
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class AuditEvent(Base):
    """An immutable audit event: who did what, to which object, when.

    Records are only created as a result of actual application actions.
    No audit records are seeded or fabricated.
    """

    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    actor_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("people.id", ondelete="SET NULL"), nullable=True)
    action_type: Mapped[str] = mapped_column(String(64), nullable=False)
    target_object_type: Mapped[str] = mapped_column(String(64), nullable=False)
    target_object_id: Mapped[str] = mapped_column(String(36), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
