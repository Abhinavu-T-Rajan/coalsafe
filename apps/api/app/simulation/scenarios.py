"""Pre-configured Underground Coal Mine Hazard Scenarios for SIH1645."""

from typing import Dict, List, Tuple

from app.simulation.models import (
    EnvironmentalTelemetry,
    EquipmentStatus,
    EquipmentType,
    HazardType,
    MinePersonnel,
    MineZone,
    ScenarioId,
    SimulationScenario,
    ZoneType,
)

SCENARIOS: Dict[ScenarioId, SimulationScenario] = {
    ScenarioId.METHANE_INRUSH_LONGWALL: SimulationScenario(
        id=ScenarioId.METHANE_INRUSH_LONGWALL,
        title="Methane Inrush & Explosion Threat at Longwall Face",
        description=(
            "A sudden gas outburst at Section LW-01 cuts off auxiliary ventilation. "
            "Methane climbs beyond statutory 1.25% electrical trip limit towards the 5-15% explosive range."
        ),
        difficulty="INTERMEDIATE",
        primaryHazard=HazardType.METHANE_ACCUMULATION,
        estimatedDurationTicks=25,
        initialPersonnelCount=12,
        dgmsFocusRegulations=[
            "CMR 2017 Reg 153 (Methane Limit & Isolation)",
            "CMR 2017 Reg 154 (Ventilation Standards)",
            "DGMS Circular 04/2019 (Intrinsically Safe Power Trips)",
        ],
        briefing=(
            "URGENT: Geological shear zone intersected by the shearer machine. "
            "Continuous telemetry indicates rapid CH4 escalation in Longwall Face and Return Airway. "
            "Protocol: (1) Cut section electrical supply immediately. (2) Spin auxiliary booster fan. "
            "(3) Sound section evacuation alarm. (4) Deploy water barriers to suppress potential ignition."
        ),
    ),
    ScenarioId.SPONTANEOUS_COMBUSTION_GOAF: SimulationScenario(
        id=ScenarioId.SPONTANEOUS_COMBUSTION_GOAF,
        title="Spontaneous Combustion & Toxic Mine Fire in Goaf",
        description=(
            "Self-heating in poorly sealed goaf panel triggers carbon monoxide breakout (CO > 120 ppm) "
            "and oxygen starvation sweeping through downstream tailgate return."
        ),
        difficulty="ADVANCED",
        primaryHazard=HazardType.MINE_FIRE_CO,
        estimatedDurationTicks=30,
        initialPersonnelCount=15,
        dgmsFocusRegulations=[
            "CMR 2017 Reg 144 (Spontaneous Heating & Fire)",
            "CMR 2017 Reg 152 (Respiratory Safety & Self-Rescuers)",
            "DGMS Tech Circ 02/2016 (Fire Stopping Construction)",
        ],
        briefing=(
            "ALERT: Graham's ratio and CO sensor array in Goaf Area G-03 show thermal runaway. "
            "Downstream return airway is experiencing heavy smoke and toxic CO migration. "
            "Protocol: (1) Order immediate self-rescuer donning. (2) Trigger whole-mine evacuation. "
            "(3) Seal Goaf with emergency stopping stoppings. (4) Dispatch Mines Rescue Brigade."
        ),
    ),
    ScenarioId.STRATA_FAILURE_ROOF_FALL: SimulationScenario(
        id=ScenarioId.STRATA_FAILURE_ROOF_FALL,
        title="Strata Failure / Roof Fall & Tailgate Entrapment",
        description=(
            "Severe weight transfer over Tailgate Roadway causes support failure, "
            "blocking airway and trapping continuous miner crew."
        ),
        difficulty="ADVANCED",
        primaryHazard=HazardType.ROOF_FALL_STRATA,
        estimatedDurationTicks=25,
        initialPersonnelCount=10,
        dgmsFocusRegulations=[
            "CMR 2017 Reg 123 (Strata Control Management Plan)",
            "CMR 2017 Reg 76 (Rescue & Recovery Protocols)",
            "DGMS Circular 08/2020 (Tell-Tale Borehole Telemetry)",
        ],
        briefing=(
            "EMERGENCY: Tell-tale extensometer in Tailgate Haulage Road indicates 22mm strata roof convergence. "
            "Rock mass collapsed, blocking passage. 4 miners are trapped behind the fall. "
            "Protocol: (1) Direct trapped miners to Refuge Chamber. (2) Maintain intake airflow to prevent asphyxiation. "
            "(3) Dispatch Mines Rescue Brigade with hydraulic cutting gear."
        ),
    ),
    ScenarioId.UNDERGROUND_WATER_INUNDATION: SimulationScenario(
        id=ScenarioId.UNDERGROUND_WATER_INUNDATION,
        title="Sudden Underground Inundation & Water Inrush",
        description=(
            "Accidental puncture of unmapped old flooded workings in lower seam causes "
            "massive hydrostatic water surge (>450 L/min) into dip development headings."
        ),
        difficulty="INTERMEDIATE",
        primaryHazard=HazardType.WATER_INUNDATION,
        estimatedDurationTicks=25,
        initialPersonnelCount=14,
        dgmsFocusRegulations=[
            "CMR 2017 Reg 149 (Inundation Danger & Barrier Pillars)",
            "CMR 2017 Reg 150 (Emergency Dewatering Capacity)",
        ],
        briefing=(
            "CRITICAL: Sudden water breach detected in Sump Bottom & Dip Haulage heading. "
            "Water level rising by 15cm per minute. Electrical equipment in pump house at risk of short circuit. "
            "Protocol: (1) Start emergency high-capacity submersible pumps. (2) Evacuate dip heading personnel. "
            "(3) Isolate submerged power cables."
        ),
    ),
    ScenarioId.CASCADING_VENTILATION_DISASTER: SimulationScenario(
        id=ScenarioId.CASCADING_VENTILATION_DISASTER,
        title="Cascading Disaster (Ventilation Fan Trip + Gas Surge)",
        description=(
            "Surface substation fault trips main exhaust fan. Methane accumulates rapidly while "
            "battery charging station experiences thermal runaway."
        ),
        difficulty="EXPERT",
        primaryHazard=HazardType.VENTILATION_FAILURE,
        estimatedDurationTicks=35,
        initialPersonnelCount=18,
        dgmsFocusRegulations=[
            "CMR 2017 Reg 153, 154, 158 (Total Ventilation Failure Protocols)",
            "CMR 2017 Reg 74 (Disaster Management Plan & Alarm)",
        ],
        briefing=(
            "MAJOR DISASTER ALERT: Surface Main Fan failure. Total underground air stagnation. "
            "Multiple hazard cascades: methane surge at Face, toxic fumes at Battery Charging Station. "
            "Protocol: (1) Sound whole-mine emergency evacuation siren. (2) Cut all non-intrinsically safe power. "
            "(3) Reverse standby ventilation fan. (4) Deploy rock dust barriers and coordinate rescue."
        ),
    ),
}


def build_default_mine_topology() -> Tuple[
    List[MineZone], List[MinePersonnel], List[EquipmentStatus]
]:
    """Builds standard 8-zone underground coal mine layout with equipment and miners."""
    zones: List[MineZone] = [
        MineZone(
            id="zone-intake",
            name="Intake Shaft & Main Incline",
            type=ZoneType.INTAKE_SHAFT,
            x=50,
            y=50,
            width=180,
            height=100,
            telemetry=EnvironmentalTelemetry(
                methanePercentage=0.02,
                carbonMonoxidePpm=1.0,
                oxygenPercentage=20.95,
                temperatureCelsius=22.0,
                airVelocityMps=3.5,
                strataPressureMpa=8.0,
                waterLevelMeters=0.01,
            ),
            connectedZoneIds=["zone-haulage", "zone-battery"],
        ),
        MineZone(
            id="zone-battery",
            name="Battery Charging & Substation",
            type=ZoneType.BATTERY_CHARGING_STATION,
            x=280,
            y=50,
            width=160,
            height=100,
            telemetry=EnvironmentalTelemetry(
                methanePercentage=0.08,
                carbonMonoxidePpm=3.0,
                oxygenPercentage=20.8,
                temperatureCelsius=26.0,
                airVelocityMps=1.8,
                strataPressureMpa=10.0,
                waterLevelMeters=0.02,
            ),
            connectedZoneIds=["zone-intake", "zone-haulage"],
        ),
        MineZone(
            id="zone-haulage",
            name="Main Haulage Roadway",
            type=ZoneType.HAULAGE_ROAD,
            x=50,
            y=200,
            width=390,
            height=100,
            telemetry=EnvironmentalTelemetry(
                methanePercentage=0.15,
                carbonMonoxidePpm=4.0,
                oxygenPercentage=20.7,
                temperatureCelsius=25.0,
                airVelocityMps=2.2,
                strataPressureMpa=12.5,
                roofConvergenceMm=2.1,
                waterLevelMeters=0.05,
            ),
            connectedZoneIds=[
                "zone-intake",
                "zone-battery",
                "zone-face",
                "zone-sump",
                "zone-refuge",
            ],
        ),
        MineZone(
            id="zone-face",
            name="Longwall Face Section LW-01",
            type=ZoneType.LONGWALL_FACE,
            x=490,
            y=200,
            width=220,
            height=100,
            telemetry=EnvironmentalTelemetry(
                methanePercentage=0.35,
                carbonMonoxidePpm=6.0,
                oxygenPercentage=20.4,
                temperatureCelsius=28.5,
                airVelocityMps=1.6,
                strataPressureMpa=18.0,
                roofConvergenceMm=4.2,
                waterLevelMeters=0.08,
            ),
            connectedZoneIds=["zone-haulage", "zone-return", "zone-goaf"],
        ),
        MineZone(
            id="zone-goaf",
            name="Goaf Area G-03 (Worked Out)",
            type=ZoneType.GOAF,
            x=490,
            y=50,
            width=220,
            height=100,
            telemetry=EnvironmentalTelemetry(
                methanePercentage=1.10,
                carbonMonoxidePpm=18.0,
                oxygenPercentage=17.5,
                temperatureCelsius=32.0,
                airVelocityMps=0.2,
                strataPressureMpa=24.0,
                waterLevelMeters=0.12,
            ),
            connectedZoneIds=["zone-face", "zone-return"],
        ),
        MineZone(
            id="zone-return",
            name="Return Airway Tailgate",
            type=ZoneType.RETURN_AIRWAY,
            x=760,
            y=125,
            width=180,
            height=175,
            telemetry=EnvironmentalTelemetry(
                methanePercentage=0.45,
                carbonMonoxidePpm=8.0,
                oxygenPercentage=20.1,
                temperatureCelsius=29.0,
                airVelocityMps=2.0,
                strataPressureMpa=16.0,
                roofConvergenceMm=3.8,
                waterLevelMeters=0.06,
            ),
            connectedZoneIds=["zone-face", "zone-goaf"],
        ),
        MineZone(
            id="zone-refuge",
            name="Emergency Refuge Chamber RC-01",
            type=ZoneType.REFUGE_CHAMBER,
            x=50,
            y=350,
            width=180,
            height=90,
            telemetry=EnvironmentalTelemetry(
                methanePercentage=0.01,
                carbonMonoxidePpm=0.0,
                oxygenPercentage=21.0,
                temperatureCelsius=21.0,
                airVelocityMps=0.5,
                strataPressureMpa=6.0,
                waterLevelMeters=0.0,
            ),
            connectedZoneIds=["zone-haulage"],
        ),
        MineZone(
            id="zone-sump",
            name="Dip Sump & Dewatering Station",
            type=ZoneType.SUMP_BOTTOM,
            x=280,
            y=350,
            width=160,
            height=90,
            telemetry=EnvironmentalTelemetry(
                methanePercentage=0.20,
                carbonMonoxidePpm=4.0,
                oxygenPercentage=20.5,
                temperatureCelsius=24.0,
                airVelocityMps=1.2,
                strataPressureMpa=11.0,
                waterInflowLpm=45.0,
                waterLevelMeters=0.30,
            ),
            connectedZoneIds=["zone-haulage"],
        ),
    ]

    personnel: List[MinePersonnel] = [
        MinePersonnel(
            id="p-01", name="Rajesh Kumar", role="SECTION_FOREMAN", currentZoneId="zone-face"
        ),
        MinePersonnel(id="p-02", name="Amit Singh", role="MINER", currentZoneId="zone-face"),
        MinePersonnel(id="p-03", name="Sunil Soren", role="MINER", currentZoneId="zone-face"),
        MinePersonnel(id="p-04", name="Vikas Murmu", role="MINER", currentZoneId="zone-face"),
        MinePersonnel(
            id="p-05", name="Dinesh Bauri", role="ELECTRICIAN", currentZoneId="zone-battery"
        ),
        MinePersonnel(
            id="p-06", name="Suresh Mahato", role="PUMP_OPERATOR", currentZoneId="zone-sump"
        ),
        MinePersonnel(id="p-07", name="Karan Tudu", role="MINER", currentZoneId="zone-haulage"),
        MinePersonnel(id="p-08", name="Manoj Hansda", role="MINER", currentZoneId="zone-haulage"),
        MinePersonnel(id="p-09", name="Pradeep Majhi", role="MINER", currentZoneId="zone-face"),
        MinePersonnel(id="p-10", name="Deepak Hembram", role="MINER", currentZoneId="zone-haulage"),
        MinePersonnel(id="p-11", name="Ramesh Gorai", role="MINER", currentZoneId="zone-return"),
        MinePersonnel(id="p-12", name="Binod Karmakar", role="MINER", currentZoneId="zone-intake"),
    ]

    equipment: List[EquipmentStatus] = [
        EquipmentStatus(
            id="eq-shearer-01",
            name="Longwall Shearer #1",
            type=EquipmentType.SHEARER,
            zoneId="zone-face",
            powerDrawKw=450.0,
        ),
        EquipmentStatus(
            id="eq-auxfan-01",
            name="Auxiliary Booster Fan",
            type=EquipmentType.AUX_FAN,
            zoneId="zone-face",
            powerDrawKw=45.0,
        ),
        EquipmentStatus(
            id="eq-conveyor-01",
            name="Armoured Face Conveyor",
            type=EquipmentType.CONVEYOR_BELT,
            zoneId="zone-face",
            powerDrawKw=110.0,
        ),
        EquipmentStatus(
            id="eq-pump-01",
            name="Submersible Dewatering Pump #1",
            type=EquipmentType.DEWATERING_PUMP,
            zoneId="zone-sump",
            powerDrawKw=75.0,
        ),
        EquipmentStatus(
            id="eq-mainfan-01",
            name="Surface Exhaust Fan",
            type=EquipmentType.MAIN_VENT_FAN,
            zoneId="zone-return",
            powerDrawKw=320.0,
        ),
        EquipmentStatus(
            id="eq-refuge-01",
            name="Life-Support Refuge Pod",
            type=EquipmentType.REFUGE_CHAMBER,
            zoneId="zone-refuge",
            powerDrawKw=15.0,
        ),
    ]

    # Map personnel to zones
    for zone in zones:
        zone.personnelIds = [p.id for p in personnel if p.currentZoneId == zone.id]

    return zones, personnel, equipment
