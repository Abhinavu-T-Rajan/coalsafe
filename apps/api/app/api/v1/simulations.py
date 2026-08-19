"""FastAPI Simulation Endpoints (Phase 3.7)."""

from typing import List

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.simulation.manager import simulation_manager
from app.simulation.models import (
    ActionResult,
    ScenarioId,
    SimulationActionRequest,
    SimulationScenario,
    SimulationScoreReport,
    SimulationState,
)

router = APIRouter(prefix="/simulations", tags=["Simulation Engine"])


class CreateSessionRequest(BaseModel):
    scenarioId: ScenarioId = Field(default=ScenarioId.METHANE_INRUSH_LONGWALL)


class StepRequest(BaseModel):
    steps: int = Field(default=1, ge=1, le=50, description="Number of ticks to advance")


@router.get(
    "/scenarios",
    response_model=List[SimulationScenario],
    summary="List Mine Hazard Scenarios",
)
def list_scenarios() -> List[SimulationScenario]:
    """Retrieves all standard underground coal mine hazard scenarios."""
    return simulation_manager.list_scenarios()


@router.post(
    "",
    response_model=SimulationState,
    status_code=status.HTTP_201_CREATED,
    summary="Start Simulation Session",
)
def start_simulation(request: CreateSessionRequest) -> SimulationState:
    """Initializes and starts a new underground mine emergency simulation session."""
    engine = simulation_manager.create_session(scenario_id=request.scenarioId)
    return engine.get_state()


@router.get(
    "/{session_id}",
    response_model=SimulationState,
    summary="Get Simulation State",
)
def get_simulation_state(session_id: str) -> SimulationState:
    """Retrieves the current multi-zone telemetry, equipment, and personnel state."""
    engine = simulation_manager.get_session(session_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation session '{session_id}' not found.",
        )
    return engine.get_state()


@router.post(
    "/{session_id}/step",
    response_model=SimulationState,
    summary="Advance Simulation Clock",
)
def step_simulation(session_id: str, request: StepRequest) -> SimulationState:
    """Advances the simulation by N physics ticks and evaluates hazards and evacuations."""
    engine = simulation_manager.get_session(session_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation session '{session_id}' not found.",
        )
    return engine.step(steps_to_advance=request.steps)


@router.post(
    "/{session_id}/action",
    response_model=ActionResult,
    summary="Execute Operator Intervention",
)
def apply_action(session_id: str, request: SimulationActionRequest) -> ActionResult:
    """Dispatches an emergency command (e.g. power cutoff, fan boost, evacuation siren)."""
    engine = simulation_manager.get_session(session_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation session '{session_id}' not found.",
        )
    return engine.apply_action(request)


@router.post(
    "/{session_id}/reset",
    response_model=SimulationState,
    summary="Reset Simulation Session",
)
def reset_simulation(session_id: str) -> SimulationState:
    """Resets the simulation session back to initial baseline state."""
    engine = simulation_manager.get_session(session_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation session '{session_id}' not found.",
        )
    scenario_id = engine.scenario.id
    new_engine = simulation_manager.create_session(scenario_id=scenario_id)
    new_engine.session_id = session_id
    simulation_manager._sessions[session_id] = new_engine
    return new_engine.get_state()


@router.get(
    "/{session_id}/report",
    response_model=SimulationScoreReport,
    summary="Get Post-Incident Debrief & DGMS Score",
)
def get_score_report(session_id: str) -> SimulationScoreReport:
    """Calculates comprehensive score, casualties, DGMS compliance rating, and debrief."""
    engine = simulation_manager.get_session(session_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation session '{session_id}' not found.",
        )
    return engine._calculate_score_report()
