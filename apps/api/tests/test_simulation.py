from fastapi.testclient import TestClient

from app.main import app
from app.simulation.engine import SimulationEngine
from app.simulation.models import (
    HazardType,
    OperatorActionType,
    ScenarioId,
    SimulationActionRequest,
)

client = TestClient(app)


def test_scenario_catalog():
    """Test scenario definitions are loaded and valid."""
    response = client.get("/api/v1/simulations/scenarios")
    assert response.status_code == 200
    scenarios = response.json()
    assert len(scenarios) >= 5
    ids = [s["id"] for s in scenarios]
    assert "METHANE_INRUSH_LONGWALL" in ids
    assert "SPONTANEOUS_COMBUSTION_GOAF" in ids
    assert "STRATA_FAILURE_ROOF_FALL" in ids


def test_simulation_lifecycle_and_actions():
    """Test full simulation session lifecycle with actions and physics updates."""
    # 1. Create Session
    response = client.post(
        "/api/v1/simulations",
        json={"scenarioId": "METHANE_INRUSH_LONGWALL"},
    )
    assert response.status_code == 201
    state = response.json()
    session_id = state["sessionId"]
    assert state["status"] == "READY"
    assert len(state["zones"]) == 8
    assert len(state["personnel"]) == 12

    # 2. Step forward to trigger gas anomaly (step 2 & step 5)
    response = client.post(f"/api/v1/simulations/{session_id}/step", json={"steps": 5})
    assert response.status_code == 200
    stepped_state = response.json()
    assert stepped_state["currentStep"] == 5

    face_zone = next(z for z in stepped_state["zones"] if z["id"] == "zone-face")
    assert face_zone["telemetry"]["methanePercentage"] >= 1.25
    assert face_zone["riskLevel"] in ["HIGH", "CRITICAL", "EMERGENCY"]
    assert len(stepped_state["activeViolations"]) > 0

    # 3. Apply Action: Cut Power to Face
    action_res = client.post(
        f"/api/v1/simulations/{session_id}/action",
        json={
            "actionType": "CUT_SECTION_POWER",
            "targetZoneId": "zone-face",
        },
    )
    assert action_res.status_code == 200
    assert action_res.json()["success"] is True

    # 4. Apply Action: Activate Auxiliary Booster Fan
    fan_res = client.post(
        f"/api/v1/simulations/{session_id}/action",
        json={
            "actionType": "ACTIVATE_AUX_FAN",
            "targetZoneId": "zone-face",
        },
    )
    assert fan_res.status_code == 200
    assert fan_res.json()["success"] is True

    # 5. Apply Action: Trigger Section Evacuation
    evac_res = client.post(
        f"/api/v1/simulations/{session_id}/action",
        json={
            "actionType": "TRIGGER_SECTION_EVACUATION",
            "targetZoneId": "zone-face",
        },
    )
    assert evac_res.status_code == 200
    assert evac_res.json()["success"] is True

    # 6. Step more to allow fan to sweep gas and miners to evacuate
    step_more = client.post(f"/api/v1/simulations/{session_id}/step", json={"steps": 10})
    assert step_more.status_code == 200
    later_state = step_more.json()

    # Verify gas decreased due to high airflow fan
    later_face = next(z for z in later_state["zones"] if z["id"] == "zone-face")
    assert later_face["powerSupplied"] is False

    # 7. Request Score Report
    report_res = client.get(f"/api/v1/simulations/{session_id}/report")
    assert report_res.status_code == 200
    report = report_res.json()
    assert "overallScore" in report
    assert "grade" in report
    assert report["livesProtected"] > 0
    assert report["dgmsComplianceScore"] > 0


def test_pure_engine_water_scenario():
    """Unit test for water inundation physics in pure engine."""
    engine = SimulationEngine(scenario_id=ScenarioId.UNDERGROUND_WATER_INUNDATION)
    engine.step(2)

    sump = next(z for z in engine.zones if z.id == "zone-sump")
    assert sump.telemetry.waterInflowLpm >= 200.0
    assert sump.activeHazard == HazardType.WATER_INUNDATION

    # Start Dewatering Pumps
    res = engine.apply_action(
        SimulationActionRequest(
            actionType=OperatorActionType.START_DEWATERING_PUMPS,
        )
    )
    assert res.success is True

    engine.step(5)
    report = engine._calculate_score_report()
    assert report.totalPersonnel == 12
    assert report.grade in ["S", "A", "B", "C", "F"]
