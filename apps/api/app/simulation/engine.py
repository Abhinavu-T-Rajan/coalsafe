"""Core Simulation Engine for COALSAFE Underground Mine Physics & Dynamics."""

import uuid
from typing import List, Optional

from app.simulation.models import (
    ActionResult,
    DgmsViolation,
    EquipmentType,
    HazardType,
    IncidentTimelineEvent,
    MinePersonnel,
    MineZone,
    OperatorActionType,
    PersonnelStatus,
    RiskLevel,
    ScenarioId,
    SimulationActionRequest,
    SimulationScoreReport,
    SimulationState,
    SimulationStatus,
    ZoneType,
)
from app.simulation.scenarios import SCENARIOS, build_default_mine_topology
from app.simulation.thresholds import evaluate_telemetry_thresholds


class SimulationEngine:
    """Manages full lifecycle, physics ticks, operator interventions, and scoring

    for a single underground coal mine simulation session.
    """

    def __init__(self, scenario_id: ScenarioId, session_id: Optional[str] = None):
        self.session_id = session_id or str(uuid.uuid4())
        self.scenario = SCENARIOS.get(scenario_id, SCENARIOS[ScenarioId.METHANE_INRUSH_LONGWALL])
        self.status = SimulationStatus.READY
        self.current_step = 0
        self.tick_duration_seconds = 5
        self.elapsed_time_seconds = 0

        self.zones: List[MineZone] = []
        self.personnel: List[MinePersonnel] = []
        self.equipment = []
        self.events: List[IncidentTimelineEvent] = []
        self.all_violations: List[DgmsViolation] = []
        self.first_hazard_step: Optional[int] = None
        self.first_action_step: Optional[int] = None
        self.evacuation_active = False
        self.evacuated_zone_ids: set[str] = set()

        self._initialize_state()

    def _initialize_state(self) -> None:
        """Sets up initial topography, personnel, and baseline events."""
        self.zones, self.personnel, self.equipment = build_default_mine_topology()
        self.events.append(
            IncidentTimelineEvent(
                step=0,
                timestampSeconds=0,
                type="SYSTEM",
                title=f"Scenario Initialized: {self.scenario.title}",
                description=f"Initial state established with {len(self.zones)} zones and {len(self.personnel)} miners.",
                severity="INFO",
            )
        )
        self._evaluate_safety_and_risks()

    def get_state(self) -> SimulationState:
        """Returns the full serializable state snapshot."""
        violations, overall_score, overall_level = self._evaluate_safety_and_risks()
        score_report = (
            self._calculate_score_report()
            if self.status in [SimulationStatus.COMPLETED, SimulationStatus.FAILED]
            else None
        )

        return SimulationState(
            sessionId=self.session_id,
            scenario=self.scenario,
            status=self.status,
            currentStep=self.current_step,
            tickDurationSeconds=self.tick_duration_seconds,
            elapsedTimeSeconds=self.elapsed_time_seconds,
            zones=self.zones,
            personnel=self.personnel,
            equipment=self.equipment,
            overallRiskLevel=overall_level,
            overallRiskScore=overall_score,
            activeViolations=violations,
            events=self.events,
            scoreReport=score_report,
        )

    def step(self, steps_to_advance: int = 1) -> SimulationState:
        """Advances the simulation by N discrete time steps (physics ticks)."""
        if self.status == SimulationStatus.READY:
            self.status = SimulationStatus.RUNNING

        if self.status not in [SimulationStatus.RUNNING, SimulationStatus.PAUSED]:
            return self.get_state()

        for _ in range(steps_to_advance):
            self.current_step += 1
            self.elapsed_time_seconds += self.tick_duration_seconds
            self._inject_scenario_events()
            self._update_physics_dynamics()
            self._update_personnel_dynamics()
            self._evaluate_safety_and_risks()

            # Check completion criteria
            if self.current_step >= self.scenario.estimatedDurationTicks:
                self.status = SimulationStatus.COMPLETED
                self.events.append(
                    IncidentTimelineEvent(
                        step=self.current_step,
                        timestampSeconds=self.elapsed_time_seconds,
                        type="SYSTEM",
                        title="Simulation Completed",
                        description=f"Simulation reached planned timeline ({self.elapsed_time_seconds}s). Final debriefing generated.",
                        severity="SUCCESS",
                    )
                )
                break

        return self.get_state()

    def apply_action(self, request: SimulationActionRequest) -> ActionResult:
        """Executes an emergency operator decision or mitigation action."""
        if self.first_action_step is None and self.first_hazard_step is not None:
            self.first_action_step = self.current_step

        target_zone = next((z for z in self.zones if z.id == request.targetZoneId), None)
        action = request.actionType
        timestamp = self.current_step
        seconds = self.elapsed_time_seconds

        success = True
        message = ""
        effectiveness = 50.0

        if action == OperatorActionType.CUT_SECTION_POWER:
            if target_zone:
                target_zone.powerSupplied = False
                for eq in self.equipment:
                    if eq.zoneId == target_zone.id and eq.type != EquipmentType.REFUGE_CHAMBER:
                        eq.isTripped = True
                message = f"Isolated electrical power supply to {target_zone.name}. Spark ignition risk eliminated."
                effectiveness = 95.0
                self.events.append(
                    IncidentTimelineEvent(
                        step=timestamp,
                        timestampSeconds=seconds,
                        type="OPERATOR_ACTION",
                        zoneId=target_zone.id,
                        title="Power Isolated",
                        description=message,
                        severity="SUCCESS",
                    )
                )
            else:
                success = False
                message = "Target zone required for power cut."

        elif action == OperatorActionType.RESTORE_SECTION_POWER:
            if target_zone:
                if target_zone.telemetry.methanePercentage >= 1.25:
                    success = False
                    message = f"BLOCKED: CMR 2017 Reg 153 prohibits restoring power while CH4 is {target_zone.telemetry.methanePercentage:.2f}% (>= 1.25%)."
                    self.events.append(
                        IncidentTimelineEvent(
                            step=timestamp,
                            timestampSeconds=seconds,
                            type="DGMS_ALERT",
                            zoneId=target_zone.id,
                            title="Illegal Power Restoration Blocked",
                            description=message,
                            severity="CRITICAL",
                        )
                    )
                else:
                    target_zone.powerSupplied = True
                    message = f"Restored electrical power to {target_zone.name}."
                    effectiveness = 60.0
            else:
                success = False
                message = "Target zone required."

        elif action == OperatorActionType.ACTIVATE_AUX_FAN:
            if target_zone:
                target_zone.auxiliaryFanRunning = True
                target_zone.telemetry.airVelocityMps = max(
                    target_zone.telemetry.airVelocityMps, 3.8
                )
                message = f"Activated high-velocity auxiliary ventilation fan in {target_zone.name} (Airflow: {target_zone.telemetry.airVelocityMps:.1f} m/s)."
                effectiveness = 90.0
                self.events.append(
                    IncidentTimelineEvent(
                        step=timestamp,
                        timestampSeconds=seconds,
                        type="OPERATOR_ACTION",
                        zoneId=target_zone.id,
                        title="Aux Fan Spun Up",
                        description=message,
                        severity="SUCCESS",
                    )
                )
            else:
                success = False
                message = "Target zone required."

        elif action == OperatorActionType.DEACTIVATE_AUX_FAN:
            if target_zone:
                target_zone.auxiliaryFanRunning = False
                target_zone.telemetry.airVelocityMps = 0.3
                message = f"Deactivated auxiliary fan in {target_zone.name}."
                effectiveness = 40.0

        elif action == OperatorActionType.TRIGGER_SECTION_EVACUATION:
            if target_zone:
                self.evacuated_zone_ids.add(target_zone.id)
                count = len(target_zone.personnelIds)
                message = f"Sounded section evacuation alarm for {target_zone.name}. {count} miners initiating withdrawal to Intake Shaft."
                effectiveness = 85.0
                self.events.append(
                    IncidentTimelineEvent(
                        step=timestamp,
                        timestampSeconds=seconds,
                        type="EVACUATION_UPDATE",
                        zoneId=target_zone.id,
                        title="Section Evacuation Alarm",
                        description=message,
                        severity="WARNING",
                    )
                )
            else:
                success = False
                message = "Target zone required."

        elif action == OperatorActionType.TRIGGER_MINE_WIDE_EVACUATION:
            self.evacuation_active = True
            for z in self.zones:
                self.evacuated_zone_ids.add(z.id)
            total = len([p for p in self.personnel if p.status != PersonnelStatus.SAFELY_EVACUATED])
            message = f"TRIGGERED WHOLE-MINE EMERGENCY EVACUATION SIREN. All {total} underground workers ordered to surface."
            effectiveness = 100.0
            self.events.append(
                IncidentTimelineEvent(
                    step=timestamp,
                    timestampSeconds=seconds,
                    type="EVACUATION_UPDATE",
                    title="Whole-Mine Siren Activated",
                    description=message,
                    severity="CRITICAL",
                )
            )

        elif action == OperatorActionType.DEPLOY_WATER_BARRIER:
            if target_zone:
                target_zone.waterBarrierDeployed = True
                message = f"Automated explosion suppression water trough barrier armed and deployed in {target_zone.name}."
                effectiveness = 80.0
                self.events.append(
                    IncidentTimelineEvent(
                        step=timestamp,
                        timestampSeconds=seconds,
                        type="OPERATOR_ACTION",
                        zoneId=target_zone.id,
                        title="Water Barrier Armed",
                        description=message,
                        severity="SUCCESS",
                    )
                )
            else:
                success = False
                message = "Target zone required."

        elif action == OperatorActionType.DEPLOY_ROCK_DUST:
            if target_zone:
                target_zone.rockDustDeployed = True
                message = f"Pressurized limestone rock dusting activated in {target_zone.name}. Incombustible content > 85%."
                effectiveness = 75.0
                self.events.append(
                    IncidentTimelineEvent(
                        step=timestamp,
                        timestampSeconds=seconds,
                        type="OPERATOR_ACTION",
                        zoneId=target_zone.id,
                        title="Rock Dusting Deployed",
                        description=message,
                        severity="INFO",
                    )
                )
            else:
                success = False
                message = "Target zone required."

        elif action == OperatorActionType.START_DEWATERING_PUMPS:
            sump = next((z for z in self.zones if z.type == ZoneType.SUMP_BOTTOM), None)
            if sump:
                sump.telemetry.waterInflowLpm = max(5.0, sump.telemetry.waterInflowLpm - 80.0)
                for eq in self.equipment:
                    if eq.type == EquipmentType.DEWATERING_PUMP:
                        eq.isOperational = True
                message = (
                    "Started heavy-duty submersible dewatering pump array (capacity: 2500 GPM)."
                )
                effectiveness = 90.0
                self.events.append(
                    IncidentTimelineEvent(
                        step=timestamp,
                        timestampSeconds=seconds,
                        type="OPERATOR_ACTION",
                        zoneId=sump.id,
                        title="Dewatering Pumps Started",
                        description=message,
                        severity="SUCCESS",
                    )
                )
            else:
                success = False
                message = "No sump zone found."

        elif action == OperatorActionType.SEAL_ZONE_STOPPINGS:
            if target_zone:
                target_zone.sealedWithStoppings = True
                target_zone.telemetry.oxygenPercentage = max(
                    5.0, target_zone.telemetry.oxygenPercentage - 6.0
                )
                target_zone.telemetry.airVelocityMps = 0.05
                message = f"Constructed explosion-proof fire stoppings around {target_zone.name}. Oxygen isolated."
                effectiveness = 95.0
                self.events.append(
                    IncidentTimelineEvent(
                        step=timestamp,
                        timestampSeconds=seconds,
                        type="OPERATOR_ACTION",
                        zoneId=target_zone.id,
                        title="Fire Stoppings Sealed",
                        description=message,
                        severity="SUCCESS",
                    )
                )
            else:
                success = False
                message = "Target zone required."

        elif action == OperatorActionType.DISPATCH_MINES_RESCUE_BRIGADE:
            target_name = target_zone.name if target_zone else "Underground Mine"
            # Rescue trapped / injured miners
            rescued = 0
            for p in self.personnel:
                if (target_zone is None or p.currentZoneId == target_zone.id) and p.status in [
                    PersonnelStatus.TRAPPED,
                    PersonnelStatus.INJURED,
                    PersonnelStatus.EXPOSED,
                ]:
                    p.status = PersonnelStatus.EVACUATING
                    rescued += 1
            message = f"Mines Rescue Brigade (MRB) deployed with self-contained breathing apparatus to {target_name}. Reached {rescued} miners."
            effectiveness = 95.0
            self.events.append(
                IncidentTimelineEvent(
                    step=timestamp,
                    timestampSeconds=seconds,
                    type="OPERATOR_ACTION",
                    zoneId=target_zone.id if target_zone else None,
                    title="Rescue Brigade Dispatched",
                    description=message,
                    severity="SUCCESS",
                )
            )

        elif action == OperatorActionType.REVERSE_MAIN_VENTILATION:
            message = "Surface main ventilation fan reversed to flush toxic fire smoke away from intake shaft escape route."
            effectiveness = 85.0
            self.events.append(
                IncidentTimelineEvent(
                    step=timestamp,
                    timestampSeconds=seconds,
                    type="OPERATOR_ACTION",
                    title="Main Ventilation Reversed",
                    description=message,
                    severity="WARNING",
                )
            )

        return ActionResult(
            success=success,
            message=message,
            actionType=action,
            targetZoneId=target_zone.id if target_zone else None,
            timestampStep=timestamp,
            effectivenessScore=effectiveness,
        )

    def _inject_scenario_events(self) -> None:
        """Triggers dynamic environmental anomalies based on the selected scenario."""
        step = self.current_step
        scenario_id = self.scenario.id

        if scenario_id == ScenarioId.METHANE_INRUSH_LONGWALL:
            if step == 2:
                self.first_hazard_step = step
                face = next(z for z in self.zones if z.id == "zone-face")
                face.telemetry.methanePercentage = 0.85
                face.activeHazard = HazardType.METHANE_ACCUMULATION
                self.events.append(
                    IncidentTimelineEvent(
                        step=step,
                        timestampSeconds=self.elapsed_time_seconds,
                        type="INJECTED_HAZARD",
                        zoneId=face.id,
                        title="Gas Outburst at Face",
                        description="Shearer cutterhead struck geological gas feeder pocket. CH4 rising to 0.85%.",
                        severity="WARNING",
                    )
                )
            elif step == 5:
                face = next(z for z in self.zones if z.id == "zone-face")
                ret = next(z for z in self.zones if z.id == "zone-return")
                face.telemetry.methanePercentage = 1.45
                ret.telemetry.methanePercentage = 0.95
                self.events.append(
                    IncidentTimelineEvent(
                        step=step,
                        timestampSeconds=self.elapsed_time_seconds,
                        type="INJECTED_HAZARD",
                        zoneId=face.id,
                        title="CH4 Exceeds 1.25% Limit",
                        description="Methane surged to 1.45% in Face Section LW-01. CMR Reg 153 trip mandated.",
                        severity="CRITICAL",
                    )
                )
            elif step == 9:
                face = next(z for z in self.zones if z.id == "zone-face")
                if not face.auxiliaryFanRunning:
                    face.telemetry.methanePercentage = min(
                        6.5, face.telemetry.methanePercentage + 1.2
                    )
                if face.powerSupplied and face.telemetry.methanePercentage >= 2.0:
                    self.events.append(
                        IncidentTimelineEvent(
                            step=step,
                            timestampSeconds=self.elapsed_time_seconds,
                            type="INJECTED_HAZARD",
                            zoneId=face.id,
                            title="EXPLOSION DANGER: Active Power in Methane Atmosphere",
                            description="CH4 in explosive range (>=2.0%) with unisolated electrical circuits. Spark imminent!",
                            severity="CRITICAL",
                        )
                    )

        elif scenario_id == ScenarioId.SPONTANEOUS_COMBUSTION_GOAF:
            if step == 2:
                self.first_hazard_step = step
                goaf = next(z for z in self.zones if z.id == "zone-goaf")
                goaf.telemetry.carbonMonoxidePpm = 65.0
                goaf.telemetry.temperatureCelsius = 38.0
                goaf.activeHazard = HazardType.MINE_FIRE_CO
                self.events.append(
                    IncidentTimelineEvent(
                        step=step,
                        timestampSeconds=self.elapsed_time_seconds,
                        type="INJECTED_HAZARD",
                        zoneId=goaf.id,
                        title="Spontaneous Heating in Goaf",
                        description="CO sensor detected 65 ppm heating signature in sealed goaf district G-03.",
                        severity="WARNING",
                    )
                )
            elif step == 6:
                goaf = next(z for z in self.zones if z.id == "zone-goaf")
                ret = next(z for z in self.zones if z.id == "zone-return")
                goaf.telemetry.carbonMonoxidePpm = 180.0
                goaf.telemetry.oxygenPercentage = 14.5
                ret.telemetry.carbonMonoxidePpm = 85.0
                self.events.append(
                    IncidentTimelineEvent(
                        step=step,
                        timestampSeconds=self.elapsed_time_seconds,
                        type="INJECTED_HAZARD",
                        zoneId=goaf.id,
                        title="Open Flame / Toxic Fumes Outbreak",
                        description="Active fire breakout in Goaf. Dense CO fumes migrating through Return Airway.",
                        severity="CRITICAL",
                    )
                )

        elif scenario_id == ScenarioId.STRATA_FAILURE_ROOF_FALL:
            if step == 2:
                self.first_hazard_step = step
                haulage = next(z for z in self.zones if z.id == "zone-haulage")
                haulage.telemetry.roofConvergenceMm = 8.5
                haulage.telemetry.strataPressureMpa = 22.0
                haulage.activeHazard = HazardType.ROOF_FALL_STRATA
                self.events.append(
                    IncidentTimelineEvent(
                        step=step,
                        timestampSeconds=self.elapsed_time_seconds,
                        type="INJECTED_HAZARD",
                        zoneId=haulage.id,
                        title="Accelerated Roof Convergence",
                        description="Hydraulic tell-tales recorded 8.5mm sudden strata sag in Main Haulage.",
                        severity="WARNING",
                    )
                )
            elif step == 5:
                haulage = next(z for z in self.zones if z.id == "zone-haulage")
                face = next(z for z in self.zones if z.id == "zone-face")
                haulage.telemetry.roofConvergenceMm = 24.0
                # Trap miners in face
                for p in self.personnel:
                    if p.currentZoneId == face.id:
                        p.status = PersonnelStatus.TRAPPED
                self.events.append(
                    IncidentTimelineEvent(
                        step=step,
                        timestampSeconds=self.elapsed_time_seconds,
                        type="INJECTED_HAZARD",
                        zoneId=haulage.id,
                        title="MASSIVE ROOF FALL: Passage Blocked",
                        description="35 tonnes of sandstone roof collapsed. Face crew is trapped behind the fall.",
                        severity="CRITICAL",
                    )
                )

        elif scenario_id == ScenarioId.UNDERGROUND_WATER_INUNDATION:
            if step == 2:
                self.first_hazard_step = step
                sump = next(z for z in self.zones if z.id == "zone-sump")
                sump.telemetry.waterInflowLpm = 250.0
                sump.telemetry.waterLevelMeters = 0.55
                sump.activeHazard = HazardType.WATER_INUNDATION
                self.events.append(
                    IncidentTimelineEvent(
                        step=step,
                        timestampSeconds=self.elapsed_time_seconds,
                        type="INJECTED_HAZARD",
                        zoneId=sump.id,
                        title="Water Inrush at Dip Heading",
                        description="Hydrostatic puncture detected. Sump inflow surged to 250 L/min.",
                        severity="WARNING",
                    )
                )
            elif step == 6:
                sump = next(z for z in self.zones if z.id == "zone-sump")
                haulage = next(z for z in self.zones if z.id == "zone-haulage")
                sump.telemetry.waterLevelMeters = 1.2
                haulage.telemetry.waterLevelMeters = 0.45
                self.events.append(
                    IncidentTimelineEvent(
                        step=step,
                        timestampSeconds=self.elapsed_time_seconds,
                        type="INJECTED_HAZARD",
                        zoneId=sump.id,
                        title="Sump Overtopped / Haulage Flooding",
                        description="Water level in sump reached 1.2m and spilling into Haulage Roadway.",
                        severity="CRITICAL",
                    )
                )

        elif scenario_id == ScenarioId.CASCADING_VENTILATION_DISASTER:
            if step == 2:
                self.first_hazard_step = step
                ret = next(z for z in self.zones if z.id == "zone-return")
                face = next(z for z in self.zones if z.id == "zone-face")
                ret.telemetry.airVelocityMps = 0.15
                face.telemetry.airVelocityMps = 0.10
                face.activeHazard = HazardType.VENTILATION_FAILURE
                self.events.append(
                    IncidentTimelineEvent(
                        step=step,
                        timestampSeconds=self.elapsed_time_seconds,
                        type="INJECTED_HAZARD",
                        title="Main Surface Fan Tripped",
                        description="Electrical substation fault tripped surface exhaust fan. Total underground air velocity stalled.",
                        severity="CRITICAL",
                    )
                )
            elif step == 5:
                face = next(z for z in self.zones if z.id == "zone-face")
                battery = next(z for z in self.zones if z.id == "zone-battery")
                face.telemetry.methanePercentage = 1.75
                battery.telemetry.temperatureCelsius = 42.0
                battery.telemetry.carbonMonoxidePpm = 45.0
                self.events.append(
                    IncidentTimelineEvent(
                        step=step,
                        timestampSeconds=self.elapsed_time_seconds,
                        type="INJECTED_HAZARD",
                        title="Cascading Gas Buildup & Battery Thermal Runaway",
                        description="Methane accumulating in Face without sweeping airflow. Battery room overheating.",
                        severity="CRITICAL",
                    )
                )

    def _update_physics_dynamics(self) -> None:
        """Physical decay / dissipation equations based on active controls."""
        for zone in self.zones:
            t = zone.telemetry

            # 1. Methane Dynamics
            if zone.auxiliaryFanRunning and t.airVelocityMps >= 1.5:
                # Dilution effect
                t.methanePercentage = max(
                    0.05, t.methanePercentage - 0.12 * (t.airVelocityMps / 2.0)
                )
            elif (
                not zone.auxiliaryFanRunning
                and zone.activeHazard == HazardType.METHANE_ACCUMULATION
            ):
                # Gas accumulation
                t.methanePercentage = min(8.0, t.methanePercentage + 0.15)

            # 2. Fire / CO Dynamics
            if zone.sealedWithStoppings:
                # Stoppings starve fire
                t.carbonMonoxidePpm = max(5.0, t.carbonMonoxidePpm - 15.0)
                t.temperatureCelsius = max(24.0, t.temperatureCelsius - 1.5)
            elif zone.activeHazard == HazardType.MINE_FIRE_CO and not zone.sealedWithStoppings:
                t.carbonMonoxidePpm = min(600.0, t.carbonMonoxidePpm + 10.0)
                t.temperatureCelsius = min(70.0, t.temperatureCelsius + 1.2)
                t.oxygenPercentage = max(10.0, t.oxygenPercentage - 0.3)

            # 3. Water Dynamics
            pumps_running = any(
                eq.type == EquipmentType.DEWATERING_PUMP and eq.isOperational
                for eq in self.equipment
            )
            if pumps_running and zone.type == ZoneType.SUMP_BOTTOM:
                t.waterLevelMeters = max(0.02, t.waterLevelMeters - 0.10)
            elif zone.activeHazard == HazardType.WATER_INUNDATION:
                t.waterLevelMeters = min(2.5, t.waterLevelMeters + 0.08)

    def _update_personnel_dynamics(self) -> None:
        """Simulates miner movement, evacuation progress, and health impact."""
        for p in self.personnel:
            if p.status == PersonnelStatus.SAFELY_EVACUATED:
                continue

            current_zone = next((z for z in self.zones if z.id == p.currentZoneId), None)
            if not current_zone:
                continue

            # Check if zone is ordered to evacuate or whole mine is evacuating
            is_evacuating = self.evacuation_active or (current_zone.id in self.evacuated_zone_ids)

            if is_evacuating and p.status not in [
                PersonnelStatus.TRAPPED,
                PersonnelStatus.CASUALTY,
            ]:
                p.status = PersonnelStatus.EVACUATING

                # Movement logic towards intake shaft
                if current_zone.id == "zone-intake":
                    p.status = PersonnelStatus.SAFELY_EVACUATED
                    p.currentZoneId = "zone-intake"
                    self.events.append(
                        IncidentTimelineEvent(
                            step=self.current_step,
                            timestampSeconds=self.elapsed_time_seconds,
                            type="EVACUATION_UPDATE",
                            zoneId="zone-intake",
                            title=f"{p.name} Safely Reached Surface",
                            description=f"{p.role} {p.name} completed evacuation via Intake Shaft.",
                            severity="SUCCESS",
                        )
                    )
                else:
                    # Move step by step towards intake
                    next_target = self._get_next_evacuation_zone(current_zone.id)
                    if next_target:
                        current_zone.personnelIds = [
                            pid for pid in current_zone.personnelIds if pid != p.id
                        ]
                        p.currentZoneId = next_target
                        target_zone = next((z for z in self.zones if z.id == next_target), None)
                        if target_zone:
                            target_zone.personnelIds.append(p.id)

            # Health & hazard exposure check
            t = current_zone.telemetry
            if t.methanePercentage >= 2.0 and current_zone.powerSupplied:
                # Severe explosion risk / injury
                p.injurySeverity = min(100.0, p.injurySeverity + 15.0)
                p.status = (
                    PersonnelStatus.INJURED if p.injurySeverity < 80 else PersonnelStatus.CASUALTY
                )
            elif t.carbonMonoxidePpm >= 100.0 or t.oxygenPercentage < 17.0:
                p.oxygenExposureRemainingMin = max(0.0, p.oxygenExposureRemainingMin - 3.0)
                p.heartRateBpm = min(160, p.heartRateBpm + 8)
                if p.oxygenExposureRemainingMin <= 0:
                    p.injurySeverity = min(100.0, p.injurySeverity + 12.0)
                    p.status = (
                        PersonnelStatus.INJURED
                        if p.injurySeverity < 80
                        else PersonnelStatus.CASUALTY
                    )

    def _get_next_evacuation_zone(self, current_zone_id: str) -> Optional[str]:
        """Evacuation route graph towards safe intake shaft or refuge chamber."""
        route_map = {
            "zone-face": "zone-haulage",
            "zone-return": "zone-face",
            "zone-goaf": "zone-return",
            "zone-battery": "zone-intake",
            "zone-sump": "zone-haulage",
            "zone-haulage": "zone-intake",
            "zone-refuge": "zone-haulage",
        }
        return route_map.get(current_zone_id, "zone-intake")

    def _evaluate_safety_and_risks(self) -> tuple[List[DgmsViolation], float, RiskLevel]:
        """Evaluates all zones and returns active violations and mine-wide score."""
        current_violations: List[DgmsViolation] = []
        zone_scores = []

        for zone in self.zones:
            violations, score, level, hazard = evaluate_telemetry_thresholds(
                zone_id=zone.id,
                zone_name=zone.name,
                telemetry=zone.telemetry,
                step=self.current_step,
            )
            zone.riskScore = score
            zone.riskLevel = level
            if hazard != HazardType.NONE:
                zone.activeHazard = hazard
            current_violations.extend(violations)
            zone_scores.append(score)

        self.all_violations.extend(current_violations)

        overall_score = sum(zone_scores) / max(1, len(zone_scores))
        if any(z.riskLevel == RiskLevel.EMERGENCY for z in self.zones):
            overall_level = RiskLevel.EMERGENCY
        elif any(z.riskLevel == RiskLevel.CRITICAL for z in self.zones):
            overall_level = RiskLevel.CRITICAL
        elif any(z.riskLevel == RiskLevel.HIGH for z in self.zones):
            overall_level = RiskLevel.HIGH
        elif any(z.riskLevel == RiskLevel.ELEVATED for z in self.zones):
            overall_level = RiskLevel.ELEVATED
        else:
            overall_level = RiskLevel.NORMAL

        return current_violations, overall_score, overall_level

    def _calculate_score_report(self) -> SimulationScoreReport:
        """Calculates final post-incident debrief and regulatory compliance score."""
        total = len(self.personnel)
        safely_evacuated = len(
            [p for p in self.personnel if p.status == PersonnelStatus.SAFELY_EVACUATED]
        )
        casualties = len([p for p in self.personnel if p.status == PersonnelStatus.CASUALTY])
        injuries = len([p for p in self.personnel if p.status == PersonnelStatus.INJURED])
        lives_protected = total - casualties

        # Response time in seconds
        response_time = (
            (self.first_action_step - self.first_hazard_step) * self.tick_duration_seconds
            if (self.first_action_step and self.first_hazard_step)
            else 45
        )

        # DGMS Compliance Score
        compliance_penalties = 0.0
        for v in self.all_violations:
            if v.severity == "LETHAL":
                compliance_penalties += 8.0
            elif v.severity == "CRITICAL":
                compliance_penalties += 3.0
            else:
                compliance_penalties += 1.0

        dgms_score = max(0.0, 100.0 - compliance_penalties)

        # Damage score
        damage = 10.0
        if any(z.telemetry.methanePercentage >= 2.0 and z.powerSupplied for z in self.zones):
            damage += 35.0
        if any(
            z.telemetry.carbonMonoxidePpm >= 200.0 and not z.sealedWithStoppings for z in self.zones
        ):
            damage += 25.0
        if any(z.telemetry.waterLevelMeters >= 1.0 for z in self.zones):
            damage += 20.0
        damage = min(100.0, damage)

        # Weighted Overall Score
        overall = (
            (lives_protected / max(1, total)) * 45.0
            + (dgms_score / 100.0) * 30.0
            + max(0.0, (60.0 - response_time) / 60.0) * 15.0
            + ((100.0 - damage) / 100.0) * 10.0
        )
        overall = min(100.0, max(0.0, overall))

        if overall >= 90.0:
            grade = "S"
        elif overall >= 80.0:
            grade = "A"
        elif overall >= 70.0:
            grade = "B"
        elif overall >= 55.0:
            grade = "C"
        else:
            grade = "F"

        strengths = []
        correctives = []

        if safely_evacuated >= total * 0.8:
            strengths.append(
                f"Prompt evacuation protected {safely_evacuated}/{total} underground workers."
            )
        if response_time <= 20:
            strengths.append(
                f"Rapid reaction latency of {response_time}s from hazard detection to initial mitigation."
            )
        if dgms_score >= 80:
            strengths.append(
                "High adherence to DGMS Coal Mines Regulations (CMR 2017) isolation procedures."
            )

        if casualties > 0:
            correctives.append(
                f"Recorded {casualties} casualties due to delayed evacuation or power isolation in explosive zones."
            )
        if damage > 40:
            correctives.append(
                "Equipment and roadway infrastructure incurred damage from unsuppressed hazards."
            )
        if not strengths:
            strengths.append("Emergency response protocols were initiated.")
        if not correctives:
            correctives.append(
                "Maintain continuous refresher drills on CMR 2017 gas isolation procedures."
            )

        summary = (
            f"Underground incident resolved with overall efficiency rating of {overall:.1f}% (Grade: {grade}). "
            f"{lives_protected}/{total} personnel protected with {dgms_score:.1f}% regulatory compliance."
        )

        return SimulationScoreReport(
            overallScore=round(overall, 1),
            grade=grade,
            livesProtected=lives_protected,
            totalPersonnel=total,
            casualties=casualties,
            injuries=injuries,
            responseTimeSeconds=response_time,
            dgmsComplianceScore=round(dgms_score, 1),
            violations=self.all_violations[-10:],
            infrastructureDamageScore=round(damage, 1),
            keyStrengths=strengths,
            correctiveActions=correctives,
            evaluationSummary=summary,
        )
