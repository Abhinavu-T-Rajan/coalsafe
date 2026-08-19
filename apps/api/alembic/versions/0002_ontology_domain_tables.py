"""Ontology domain tables

Creates all 10 domain tables for the COALSAFE ontology layer.
No seed data. No INSERT statements.
A fresh database will contain schema only, with zero operational records.

Revision ID: 0002_ontology
Revises: 0001_initial
Create Date: 2026-08-19

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0002_ontology"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # mines
    # ------------------------------------------------------------------
    op.create_table(
        "mines",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("code", sa.String(64), nullable=False, unique=True),
        sa.Column("location", sa.String(512), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="ACTIVE"),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )

    # ------------------------------------------------------------------
    # mine_areas
    # ------------------------------------------------------------------
    op.create_table(
        "mine_areas",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("mine_id", sa.String(36), sa.ForeignKey("mines.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("code", sa.String(64), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="ACTIVE"),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )

    # ------------------------------------------------------------------
    # people
    # ------------------------------------------------------------------
    op.create_table(
        "people",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("mine_id", sa.String(36), sa.ForeignKey("mines.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("employee_id", sa.String(64), nullable=False),
        sa.Column("role", sa.String(128), nullable=False),
        sa.Column("contact_information", sa.String(512), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="ACTIVE"),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )

    # ------------------------------------------------------------------
    # equipment
    # ------------------------------------------------------------------
    op.create_table(
        "equipment",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("mine_id", sa.String(36), sa.ForeignKey("mines.id", ondelete="CASCADE"), nullable=False),
        sa.Column("area_id", sa.String(36), sa.ForeignKey("mine_areas.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("equipment_code", sa.String(64), nullable=False),
        sa.Column("equipment_type", sa.String(128), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="OPERATIONAL"),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )

    # ------------------------------------------------------------------
    # shifts
    # ------------------------------------------------------------------
    op.create_table(
        "shifts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("mine_id", sa.String(36), sa.ForeignKey("mines.id", ondelete="CASCADE"), nullable=False),
        sa.Column("area_id", sa.String(36), sa.ForeignKey("mine_areas.id", ondelete="SET NULL"), nullable=True),
        sa.Column("supervisor_id", sa.String(36), sa.ForeignKey("people.id", ondelete="SET NULL"), nullable=True),
        sa.Column("shift_type", sa.String(64), nullable=False),
        sa.Column("start_time", sa.String(32), nullable=False),
        sa.Column("end_time", sa.String(32), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="SCHEDULED"),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )

    # ------------------------------------------------------------------
    # handovers
    # ------------------------------------------------------------------
    op.create_table(
        "handovers",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("shift_id", sa.String(36), sa.ForeignKey("shifts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by", sa.String(36), sa.ForeignKey("people.id", ondelete="SET NULL"), nullable=True),
        sa.Column("summary", sa.Text, nullable=True),
        sa.Column("production_information", sa.Text, nullable=True),
        sa.Column("equipment_information", sa.Text, nullable=True),
        sa.Column("safety_information", sa.Text, nullable=True),
        sa.Column("red_flags", sa.JSON, nullable=True),
        sa.Column("required_actions", sa.JSON, nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="DRAFT"),
        sa.Column("submitted_at", sa.DateTime, nullable=True),
        sa.Column("acknowledged_at", sa.DateTime, nullable=True),
        sa.Column("sha256_hash", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    # ------------------------------------------------------------------
    # hazards
    # ------------------------------------------------------------------
    op.create_table(
        "hazards",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("mine_id", sa.String(36), sa.ForeignKey("mines.id", ondelete="CASCADE"), nullable=False),
        sa.Column("area_id", sa.String(36), sa.ForeignKey("mine_areas.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reported_by", sa.String(36), sa.ForeignKey("people.id", ondelete="SET NULL"), nullable=True),
        sa.Column("assigned_to", sa.String(36), sa.ForeignKey("people.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("category", sa.String(64), nullable=False),
        sa.Column("severity", sa.String(32), nullable=False, server_default="MEDIUM"),
        sa.Column("status", sa.String(32), nullable=False, server_default="OPEN"),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("detected_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )

    # ------------------------------------------------------------------
    # incidents
    # ------------------------------------------------------------------
    op.create_table(
        "incidents",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("mine_id", sa.String(36), sa.ForeignKey("mines.id", ondelete="CASCADE"), nullable=False),
        sa.Column("area_id", sa.String(36), sa.ForeignKey("mine_areas.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reported_by", sa.String(36), sa.ForeignKey("people.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("type", sa.String(64), nullable=False),
        sa.Column("severity", sa.String(32), nullable=False, server_default="MEDIUM"),
        sa.Column("status", sa.String(32), nullable=False, server_default="OPEN"),
        sa.Column("occurred_at", sa.DateTime, nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("resolved_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    # ------------------------------------------------------------------
    # domain_actions
    # ------------------------------------------------------------------
    op.create_table(
        "domain_actions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("type", sa.String(64), nullable=False),
        sa.Column("actor_id", sa.String(36), sa.ForeignKey("people.id", ondelete="SET NULL"), nullable=True),
        sa.Column("target_object_type", sa.String(64), nullable=False),
        sa.Column("target_object_id", sa.String(36), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="COMPLETED"),
        sa.Column("metadata", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    # ------------------------------------------------------------------
    # audit_events  (append-only audit trail)
    # ------------------------------------------------------------------
    op.create_table(
        "audit_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("actor_id", sa.String(36), sa.ForeignKey("people.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action_type", sa.String(64), nullable=False),
        sa.Column("target_object_type", sa.String(64), nullable=False),
        sa.Column("target_object_id", sa.String(36), nullable=False),
        sa.Column("timestamp", sa.DateTime, nullable=False),
        sa.Column("metadata", sa.JSON, nullable=True),
    )

    # No seed data. No INSERT statements.
    # A fresh database contains schema + zero operational records.


def downgrade() -> None:
    op.drop_table("audit_events")
    op.drop_table("domain_actions")
    op.drop_table("incidents")
    op.drop_table("hazards")
    op.drop_table("handovers")
    op.drop_table("shifts")
    op.drop_table("equipment")
    op.drop_table("people")
    op.drop_table("mine_areas")
    op.drop_table("mines")
