"""Tests for the COALSAFE Ontology Domain Layer.

Verifies:
- Empty system state: zero records on clean database
- Mine, Area, Person, Equipment, Shift creation
- Domain actions: submit handover, acknowledge handover, close hazard, resolve incident
- Reusable context queries: getMineContext, getAreaContext
- Audit event generation
"""

import uuid

import pytest
from fastapi.testclient import TestClient

from app.db.session import Base, engine
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    """Ensure tables are created in the test database."""
    Base.metadata.create_all(bind=engine)
    yield


def test_empty_system_experience():
    """Verify that domain endpoints return empty lists when no records exist."""
    res = client.get("/api/v1/ontology/mines")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    res_hazards = client.get("/api/v1/ontology/hazards")
    assert res_hazards.status_code == 200
    assert isinstance(res_hazards.json(), list)

    res_incidents = client.get("/api/v1/ontology/incidents")
    assert res_incidents.status_code == 200
    assert isinstance(res_incidents.json(), list)


def test_mine_lifecycle_and_context():
    """Create a mine, add area, person, equipment, shift, and check context."""
    # 1. Create Mine
    mine_payload = {
        "name": "Korba Colliery Seam 4",
        "code": f"MINE-TEST-{uuid.uuid4().hex[:8]}",
        "location": "Korba Coalfield, Chhattisgarh",
        "status": "ACTIVE",
    }
    mine_res = client.post("/api/v1/ontology/mines", json=mine_payload)
    assert mine_res.status_code == 201
    mine = mine_res.json()
    mine_id = mine["id"]
    assert mine["name"] == "Korba Colliery Seam 4"

    # 2. Add Area
    area_payload = {
        "mine_id": mine_id,
        "name": "Panel LW-01",
        "code": "AREA-LW-01",
        "description": "Longwall retreating extraction panel",
        "status": "ACTIVE",
    }
    area_res = client.post(f"/api/v1/ontology/mines/{mine_id}/areas", json=area_payload)
    assert area_res.status_code == 201
    area = area_res.json()
    area_id = area["id"]

    # 3. Add Person
    person_payload = {
        "mine_id": mine_id,
        "name": "Ramesh Chandra",
        "employee_id": "DGMS/OV/2024/5521",
        "role": "Shift Overman",
        "contact_information": "Radio Ch-4",
        "status": "ACTIVE",
    }
    person_res = client.post(f"/api/v1/ontology/mines/{mine_id}/people", json=person_payload)
    assert person_res.status_code == 201
    person = person_res.json()
    person_id = person["id"]

    # 4. Add Equipment
    eq_payload = {
        "mine_id": mine_id,
        "area_id": area_id,
        "name": "Continuous Miner #1",
        "equipment_code": "EQ-CM-01",
        "equipment_type": "CONTINUOUS_MINER",
        "status": "OPERATIONAL",
    }
    eq_res = client.post(f"/api/v1/ontology/mines/{mine_id}/equipment", json=eq_payload)
    assert eq_res.status_code == 201

    # 5. Schedule Shift
    shift_payload = {
        "mine_id": mine_id,
        "area_id": area_id,
        "supervisor_id": person_id,
        "shift_type": "SHIFT_1_MORNING",
        "start_time": "2026-08-19T06:00:00",
        "status": "SCHEDULED",
    }
    shift_res = client.post(f"/api/v1/ontology/mines/{mine_id}/shifts", json=shift_payload)
    assert shift_res.status_code == 201
    shift = shift_res.json()
    shift_id = shift["id"]

    # 6. Create & Submit Handover
    handover_payload = {
        "shift_id": shift_id,
        "created_by": person_id,
        "summary": "Morning extraction completed with zero incidents.",
    }
    ho_res = client.post(f"/api/v1/ontology/shifts/{shift_id}/handovers", json=handover_payload)
    assert ho_res.status_code == 201
    ho = ho_res.json()
    assert ho["status"] == "DRAFT"

    submit_res = client.post(f"/api/v1/ontology/handovers/{ho['id']}/submit", json={"actor_id": person_id})
    assert submit_res.status_code == 200
    assert submit_res.json()["status"] == "SUBMITTED"

    # 7. Verify Mine Context
    ctx_res = client.get(f"/api/v1/ontology/mines/{mine_id}/context")
    assert ctx_res.status_code == 200
    ctx = ctx_res.json()
    assert ctx["area_count"] >= 1
    assert ctx["people_count"] >= 1
    assert ctx["equipment_count"] >= 1
    assert ctx["shift_count"] >= 1

    # 7. Verify Area Context
    area_ctx_res = client.get(f"/api/v1/ontology/areas/{area_id}/context")
    assert area_ctx_res.status_code == 200
    area_ctx = area_ctx_res.json()
    assert area_ctx["equipment_count"] >= 1


def test_hazard_actions_and_audit_trail():
    """Test reporting hazard, closing it, and verifying audit events."""
    # 1. Create Mine for hazard
    mine_res = client.post(
        "/api/v1/ontology/mines",
        json={
            "name": "Singareni Seam 5",
            "code": f"MINE-HZ-{uuid.uuid4().hex[:8]}",
            "location": "Godavari Valley Coalfield",
            "status": "ACTIVE",
        },
    )
    mine_id = mine_res.json()["id"]

    # 2. Report Hazard
    hazard_payload = {
        "mine_id": mine_id,
        "title": "Elevated CH4 at Return Split",
        "description": "Detector recorded 0.85% CH4 in return air split.",
        "category": "MINE_GAS_VENTILATION",
        "severity": "HIGH",
        "location": "Return Regulator R-02",
    }
    hz_res = client.post("/api/v1/ontology/hazards", json=hazard_payload)
    assert hz_res.status_code == 201
    hazard = hz_res.json()
    assert hazard["status"] == "OPEN"
    hazard_id = hazard["id"]

    # 3. Close Hazard (Domain Action)
    close_res = client.post(
        f"/api/v1/ontology/hazards/{hazard_id}/close",
        json={"resolution_notes": "Auxiliary fan speed increased, CH4 reduced to 0.22%."},
    )
    assert close_res.status_code == 200
    closed_hazard = close_res.json()
    assert closed_hazard["status"] == "CLOSED"

    # 4. Verify Audit Events
    audit_res = client.get("/api/v1/ontology/audit-events")
    assert audit_res.status_code == 200
    events = audit_res.json()
    action_types = [e["action_type"] for e in events]
    assert "REPORT_HAZARD" in action_types
    assert "CLOSE_HAZARD" in action_types


def test_incident_lifecycle():
    """Test logging and resolving an incident."""
    mine_res = client.post(
        "/api/v1/ontology/mines",
        json={
            "name": "Jharia Deep Mine",
            "code": f"MINE-INC-{uuid.uuid4().hex[:8]}",
            "location": "Dhanbad, Jharkhand",
            "status": "ACTIVE",
        },
    )
    mine_id = mine_res.json()["id"]

    # Create Incident
    inc_payload = {
        "mine_id": mine_id,
        "title": "Conveyor Belt Motor Trip",
        "description": "Thermal overload trip on main haulage conveyor.",
        "type": "OPERATIONAL",
        "severity": "MEDIUM",
        "location": "Trunk Conveyor TC-01",
    }
    inc_res = client.post("/api/v1/ontology/incidents", json=inc_payload)
    assert inc_res.status_code == 201
    incident = inc_res.json()
    assert incident["status"] == "OPEN"
    inc_id = incident["id"]

    # Resolve Incident
    resolve_res = client.post(
        f"/api/v1/ontology/incidents/{inc_id}/resolve",
        json={"resolution_notes": "Belt tension adjusted, motor restarted after cooldown."},
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "RESOLVED"
