"""DGMS / CMR 2017 Regulatory Safety Thresholds & Hazard Scoring Engine."""

from typing import List, Tuple

from app.simulation.models import (
    DgmsViolation,
    EnvironmentalTelemetry,
    HazardType,
    RiskLevel,
)


def evaluate_telemetry_thresholds(
    zone_id: str,
    zone_name: str,
    telemetry: EnvironmentalTelemetry,
    step: int,
) -> Tuple[List[DgmsViolation], float, RiskLevel, HazardType]:
    """Evaluates sensor telemetry against statutory Coal Mines Regulations (CMR 2017)

    and DGMS technical circulars.
    Returns: (violations, risk_score_0_to_100, risk_level, dominant_hazard)
    """
    violations: List[DgmsViolation] = []
    risk_score = 5.0
    dominant_hazard = HazardType.NONE

    # 1. Methane (CH4) Rules - CMR 2017 Reg 153
    ch4 = telemetry.methanePercentage
    if ch4 >= 2.0:
        risk_score += 65.0
        dominant_hazard = HazardType.METHANE_ACCUMULATION
        violations.append(
            DgmsViolation(
                code="CMR_REG_153_3",
                regulation="CMR 2017 Reg 153(3) - General Withdrawal Limit Exceeded",
                zoneId=zone_id,
                severity="LETHAL",
                message=f"Methane at {ch4:.2f}% in {zone_name}. Immediate total withdrawal mandatory.",
                timestampStep=step,
            )
        )
    elif ch4 >= 1.25:
        risk_score += 45.0
        dominant_hazard = HazardType.METHANE_ACCUMULATION
        violations.append(
            DgmsViolation(
                code="CMR_REG_153_2",
                regulation="CMR 2017 Reg 153(2) - Power Cutoff & Face Evacuation Limit",
                zoneId=zone_id,
                severity="CRITICAL",
                message=f"Methane at {ch4:.2f}% in {zone_name}. Power must be isolated immediately.",
                timestampStep=step,
            )
        )
    elif ch4 >= 0.75:
        risk_score += 20.0
        dominant_hazard = HazardType.METHANE_ACCUMULATION
        violations.append(
            DgmsViolation(
                code="CMR_REG_153_1",
                regulation="CMR 2017 Reg 153(1) - Methane Caution Threshold",
                zoneId=zone_id,
                severity="WARNING",
                message=f"Methane concentration at {ch4:.2f}% in {zone_name}. Increase ventilation.",
                timestampStep=step,
            )
        )

    # 2. Carbon Monoxide (CO) Rules - CMR 2017 Reg 144
    co = telemetry.carbonMonoxidePpm
    if co >= 400.0:
        risk_score += 70.0
        dominant_hazard = HazardType.MINE_FIRE_CO
        violations.append(
            DgmsViolation(
                code="CMR_REG_144_LETHAL",
                regulation="CMR 2017 Reg 144 - Lethal Toxic Gas Atmosphere",
                zoneId=zone_id,
                severity="LETHAL",
                message=f"Carbon Monoxide reached lethal concentration {co:.1f} ppm in {zone_name}.",
                timestampStep=step,
            )
        )
    elif co >= 100.0:
        risk_score += 45.0
        dominant_hazard = HazardType.MINE_FIRE_CO
        violations.append(
            DgmsViolation(
                code="CMR_REG_144_CRITICAL",
                regulation="CMR 2017 Reg 144 - Active Underground Fire / Toxic Atmosphere",
                zoneId=zone_id,
                severity="CRITICAL",
                message=f"Carbon Monoxide at {co:.1f} ppm in {zone_name}. Evacuate immediately.",
                timestampStep=step,
            )
        )
    elif co >= 50.0:
        risk_score += 20.0
        if dominant_hazard == HazardType.NONE:
            dominant_hazard = HazardType.MINE_FIRE_CO
        violations.append(
            DgmsViolation(
                code="CMR_REG_144_WARN",
                regulation="CMR 2017 Reg 144 - Spontaneous Combustion / Heating Warning",
                zoneId=zone_id,
                severity="WARNING",
                message=f"CO concentration {co:.1f} ppm indicates active heating in {zone_name}.",
                timestampStep=step,
            )
        )

    # 3. Oxygen (O2) Deficiency - CMR 2017 Reg 152
    o2 = telemetry.oxygenPercentage
    if o2 < 17.0:
        risk_score += 60.0
        violations.append(
            DgmsViolation(
                code="CMR_REG_152_CRITICAL",
                regulation="CMR 2017 Reg 152 - Critical Oxygen Depletion / Asphyxiation",
                zoneId=zone_id,
                severity="CRITICAL",
                message=f"Oxygen fell to {o2:.1f}% in {zone_name}. Self-rescuers must be donned.",
                timestampStep=step,
            )
        )
    elif o2 < 19.0:
        risk_score += 25.0
        violations.append(
            DgmsViolation(
                code="CMR_REG_152_WARN",
                regulation="CMR 2017 Reg 152 - Substandard Ventilation (O2 < 19%)",
                zoneId=zone_id,
                severity="WARNING",
                message=f"Oxygen level {o2:.1f}% below statutory 19.0% standard in {zone_name}.",
                timestampStep=step,
            )
        )

    # 4. Strata / Roof Pressure & Convergence - CMR 2017 Reg 123 (Strata Control)
    convergence = telemetry.roofConvergenceMm
    pressure = telemetry.strataPressureMpa
    if convergence >= 15.0 or pressure >= 28.0:
        risk_score += 55.0
        if dominant_hazard == HazardType.NONE:
            dominant_hazard = HazardType.ROOF_FALL_STRATA
        violations.append(
            DgmsViolation(
                code="CMR_REG_123_CRITICAL",
                regulation="CMR 2017 Reg 123 - Imminent Strata / Roof Collapse",
                zoneId=zone_id,
                severity="CRITICAL",
                message=f"Severe roof convergence ({convergence:.1f} mm) & pressure ({pressure:.1f} MPa) in {zone_name}.",
                timestampStep=step,
            )
        )
    elif convergence >= 6.0 or pressure >= 20.0:
        risk_score += 25.0
        if dominant_hazard == HazardType.NONE:
            dominant_hazard = HazardType.ROOF_FALL_STRATA
        violations.append(
            DgmsViolation(
                code="CMR_REG_123_WARN",
                regulation="CMR 2017 Reg 123 - Elevated Strata Pressure",
                zoneId=zone_id,
                severity="WARNING",
                message=f"Roof convergence accelerating ({convergence:.1f} mm) in {zone_name}.",
                timestampStep=step,
            )
        )

    # 5. Inundation & Water Level - CMR 2017 Reg 149
    water_level = telemetry.waterLevelMeters
    if water_level >= 0.8:
        risk_score += 50.0
        if dominant_hazard == HazardType.NONE:
            dominant_hazard = HazardType.WATER_INUNDATION
        violations.append(
            DgmsViolation(
                code="CMR_REG_149_CRITICAL",
                regulation="CMR 2017 Reg 149 - Critical Inundation Flood Level",
                zoneId=zone_id,
                severity="CRITICAL",
                message=f"Water level reached {water_level:.2f} m in {zone_name}. Roadway submerged.",
                timestampStep=step,
            )
        )
    elif water_level >= 0.35:
        risk_score += 20.0
        if dominant_hazard == HazardType.NONE:
            dominant_hazard = HazardType.WATER_INUNDATION

    # 6. Ventilation Velocity Stagnation
    velocity = telemetry.airVelocityMps
    if velocity < 0.4 and zone_name != "Goaf Area":
        risk_score += 15.0
        if dominant_hazard == HazardType.NONE:
            dominant_hazard = HazardType.VENTILATION_FAILURE
        violations.append(
            DgmsViolation(
                code="CMR_REG_154_VENT",
                regulation="CMR 2017 Reg 154 - Inadequate Airflow Velocity (<0.4 m/s)",
                zoneId=zone_id,
                severity="WARNING",
                message=f"Air velocity dropped to {velocity:.2f} m/s in {zone_name}. Air stagnation.",
                timestampStep=step,
            )
        )

    # Clamp risk score
    clamped_score = min(100.0, max(0.0, risk_score))

    # Derive Risk Level
    if clamped_score >= 80.0:
        level = RiskLevel.EMERGENCY
    elif clamped_score >= 60.0:
        level = RiskLevel.CRITICAL
    elif clamped_score >= 40.0:
        level = RiskLevel.HIGH
    elif clamped_score >= 20.0:
        level = RiskLevel.ELEVATED
    else:
        level = RiskLevel.NORMAL

    return violations, clamped_score, level, dominant_hazard
