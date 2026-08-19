"""Session Manager for Active Simulation Engines."""

from typing import Dict, List, Optional

from app.simulation.engine import SimulationEngine
from app.simulation.models import ScenarioId, SimulationScenario
from app.simulation.scenarios import SCENARIOS


class SimulationManager:
    """Manages in-memory simulation instances across concurrent users."""

    def __init__(self):
        self._sessions: Dict[str, SimulationEngine] = {}

    def list_scenarios(self) -> List[SimulationScenario]:
        """Returns all available standard mine hazard scenarios."""
        return list(SCENARIOS.values())

    def create_session(self, scenario_id: ScenarioId) -> SimulationEngine:
        """Initializes a new simulation engine instance."""
        engine = SimulationEngine(scenario_id=scenario_id)
        self._sessions[engine.session_id] = engine
        return engine

    def get_session(self, session_id: str) -> Optional[SimulationEngine]:
        """Retrieves an active session by ID."""
        return self._sessions.get(session_id)

    def delete_session(self, session_id: str) -> bool:
        """Terminates and removes a simulation session."""
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False


simulation_manager = SimulationManager()
