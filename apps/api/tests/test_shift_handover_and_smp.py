from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_and_create_shift_logs():
    """Test creating a new statutory Overman log and listing logs."""
    # Create new shift log with automatic red flag detection
    payload = {
        "logType": "OVERMAN_LOG",
        "mineName": "Singareni Colliery Seam 3",
        "seamName": "Queen Seam Bottom Section",
        "districtSection": "Longwall District LW-02",
        "date": "2026-08-19",
        "shift": "SHIFT_2_AFTERNOON",
        "outgoingSupervisorName": "Deepak Hembram",
        "outgoingSupervisorRole": "Overman In-Charge",
        "outgoingSupervisorCertNo": "DGMS/OV/2023/9102",
        "manpowerDeployed": 30,
        "productionTonnage": 540.0,
        "strataConditionSummary": "Roof convergence 1.8mm. Hydraulic props set to 260 bar.",
        "ventilationAdequacy": "Intake airflow 1550 m3/min.",
        "waterAccumulationStatus": "Sump water level 0.28m.",
        "dustSuppressionActive": True,
        "gasReadings": [
            {
                "location": "Face LW-02",
                "ch4Percent": 0.85,
                "coPpm": 8.0,
                "o2Percent": 20.7,
                "airVelocityMps": 2.2,
                "status": "ELEVATED",
            }
        ],
        "equipmentLogs": [
            {
                "equipmentId": "EQ-CM-02",
                "equipmentName": "Continuous Miner #2",
                "operatingHours": 7.0,
                "breakdownMinutes": 0.0,
                "flpEnclosureChecked": True,
            }
        ],
        "redFlags": [],
        "pendingActionsForNextShift": ["Re-check methane at face LW-02"],
        "generalRemarks": "All statutory safety standards maintained.",
    }

    create_res = client.post("/api/v1/shift-logs", json=payload)
    assert create_res.status_code == 201
    new_log = create_res.json()
    assert new_log["id"].startswith("LOG-OVERMAN-")
    assert new_log["handoverStatus"] == "PENDING_HANDOVER"
    assert len(new_log["sha256Hash"]) == 64
    assert len(new_log["redFlags"]) >= 1

    # List logs
    res = client.get("/api/v1/shift-logs")
    assert res.status_code == 200
    logs = res.json()
    assert len(logs) >= 1
    assert any(log["logType"] == "OVERMAN_LOG" for log in logs)


def test_handover_signoff_and_pdf_generation():
    """Test digital handover acknowledgment and PDF report binary generation."""
    # 1. Create a log first
    payload = {
        "logType": "VENTILATION_OFFICER_LOG",
        "mineName": "Singareni Colliery Seam 3",
        "seamName": "Queen Seam Bottom Section",
        "districtSection": "Main Exhaust District",
        "date": "2026-08-19",
        "shift": "SHIFT_1_MORNING",
        "outgoingSupervisorName": "Vikram Adithya",
        "outgoingSupervisorRole": "Ventilation Officer",
        "outgoingSupervisorCertNo": "DGMS/VENT/2019/3310",
        "manpowerDeployed": 8,
        "productionTonnage": 0.0,
        "strataConditionSummary": "Air crossings intact.",
        "ventilationAdequacy": "Total mine intake 4800 m3/min.",
        "waterAccumulationStatus": "Dry.",
        "dustSuppressionActive": True,
        "gasReadings": [],
        "equipmentLogs": [],
        "redFlags": [],
        "pendingActionsForNextShift": [],
        "generalRemarks": "Ventilation parameters normal.",
    }
    create_res = client.post("/api/v1/shift-logs", json=payload)
    assert create_res.status_code == 201
    log_id = create_res.json()["id"]

    # 2. Complete handover
    signoff_payload = {
        "logId": log_id,
        "incomingSupervisorName": "Suresh Mahato",
        "incomingSupervisorRole": "Shift In-Charge (Night)",
        "incomingSupervisorPin": "9421",
        "handoverNotes": "All safety flags and face conditions verified on site.",
        "acceptedRedFlagIds": [],
    }
    signoff_res = client.post(f"/api/v1/shift-logs/{log_id}/handover", json=signoff_payload)
    assert signoff_res.status_code == 200
    signed_log = signoff_res.json()
    assert signed_log["handoverStatus"] == "ACKNOWLEDGED_AND_ACCEPTED"
    assert signed_log["incomingSupervisorName"] == "Suresh Mahato"

    # 3. Download Statutory PDF Report
    pdf_res = client.get(f"/api/v1/shift-logs/{log_id}/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 1000  # Valid PDF binary


def test_smp_hira_and_summary():
    """Test DGMS Safety Management Plan HIRA register and RPN calculations."""
    # Register new hazard into SMP
    new_hazard = {
        "hazardCategory": "ELECTRICITY_MACHINERY",
        "activity": "Substation Cable Jointing & Transformer Maintenance",
        "hazardDescription": "Electric flashover and arc blast during high voltage (3.3kV) cable jointing.",
        "potentialConsequence": "Severe thermal burns, electrocution, ignition of explosive atmosphere.",
        "initialLikelihood": 3,
        "initialConsequence": 5,
        "hierarchyOfControl": "ENGINEERING_CONTROL",
        "controlMeasures": [
            "Lockout / Tagout (LOTO) procedure on 3.3kV vacuum circuit breaker",
            "Flameproof FLP enclosure earth leakage relay testing with 30mA trip threshold",
        ],
        "sopReference": "SOP-ELEC-CMR53",
        "residualLikelihood": 1,
        "residualConsequence": 2,
        "accountableOfficialRole": "Colliery Electrical Engineer",
        "inspectionFrequency": "WEEKLY",
        "tarpNormalGreen": "Zero insulation leakage; LOTO tags logged.",
        "tarpTriggerYellow": "Insulation resistance drops < 2 Megaohms. Halt energization.",
        "tarpActionRed": "Flashover or earth fault trip. Total section electrical shutdown.",
    }
    create_res = client.post("/api/v1/smp/hazards", json=new_hazard)
    assert create_res.status_code == 201
    hazard_record = create_res.json()
    assert hazard_record["initialRpn"] == 15
    assert hazard_record["initialRiskCategory"] == "HIGH"
    assert hazard_record["residualRpn"] == 2
    assert hazard_record["residualRiskCategory"] == "LOW"

    # List hazards
    hira_res = client.get("/api/v1/smp/hazards")
    assert hira_res.status_code == 200
    hazards = hira_res.json()
    assert len(hazards) >= 1
    assert any(h["hazardCategory"] == "ELECTRICITY_MACHINERY" for h in hazards)

    # Get SMP Summary
    summary_res = client.get("/api/v1/smp/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["totalHazardsIdentified"] >= 1


def test_erp_sync_bridge():
    """Test synchronizing shift log with ERP / SAP."""
    # Create log first
    payload = {
        "logType": "OVERMAN_LOG",
        "mineName": "Singareni Colliery Seam 3",
        "seamName": "Queen Seam Bottom Section",
        "districtSection": "Longwall District LW-03",
        "date": "2026-08-19",
        "shift": "SHIFT_1_MORNING",
        "outgoingSupervisorName": "Rajesh Kumar",
        "outgoingSupervisorRole": "Shift Overman",
        "outgoingSupervisorCertNo": "DGMS/OV/2021/8472",
        "manpowerDeployed": 28,
        "productionTonnage": 620.0,
        "strataConditionSummary": "Stable.",
        "ventilationAdequacy": "Normal.",
        "waterAccumulationStatus": "Dry.",
        "dustSuppressionActive": True,
        "gasReadings": [],
        "equipmentLogs": [],
        "redFlags": [],
        "pendingActionsForNextShift": [],
        "generalRemarks": "Normal.",
    }
    create_res = client.post("/api/v1/shift-logs", json=payload)
    log_id = create_res.json()["id"]

    sync_res = client.post(f"/api/v1/erp/sync/{log_id}")
    assert sync_res.status_code == 201
    payload = sync_res.json()
    assert payload["erpStatus"] == "SYNCED"
    assert payload["sapTransactionId"].startswith("SAP-COL-")

    ledger_res = client.get("/api/v1/erp/sync-logs")
    assert ledger_res.status_code == 200
    assert len(ledger_res.json()) >= 1
