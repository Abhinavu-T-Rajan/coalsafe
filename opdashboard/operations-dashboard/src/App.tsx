import { useState } from 'react'
import './App.css'

function App() {
  const [incidentType, setIncidentType]=useState("")
  const [severity, setSeverity] = useState("")
  const [workersAtRisk, setWorkersAtRisk] = useState(0)
  const [injuredCount, setInjuredCount] = useState(0)
const [hazardIntensity, setHazardIntensity] = useState(0)
const [workersInDangerZone, setWorkersInDangerZone] = useState(0)
const [nearestWorkerDistance, setNearestWorkerDistance] = useState(0)
const [communicationStatus, setCommunicationStatus] = useState("")
const [rescueResponseTime, setRescueResponseTime] = useState(0)
const [timeSinceIncident, setTimeSinceIncident] = useState(0)
  const [priority, setPriority] = useState("")
  const [confidence, setConfidence] = useState<number | null>(null)
    const getSafetyMeasures = () => {
    if (!incidentType || !priority) {
      return []
    }

    if (incidentType === "Gas Leak") {
      return [
        "Withdraw workers from the affected area",
        "Verify ventilation and gas monitoring",
        "Eliminate or isolate ignition sources",
        "Restrict access to the affected zone"
      ]
    }

    if (incidentType === "Fire") {
      return [
        "Raise the emergency alarm",
        "Withdraw personnel from the affected area",
        "Isolate power sources where safe",
        "Initiate the mine fire emergency procedure"
      ]
    }

    if (incidentType === "Roof Fall") {
      return [
        "Withdraw workers from the unsupported area",
        "Barricade the danger zone",
        "Inspect roof and ground conditions",
        "Implement approved roof-support procedures"
      ]
    }

    if (incidentType === "Water Ingress") {
      return [
        "Withdraw personnel from threatened workings",
        "Monitor water levels",
        "Activate drainage and pumping arrangements",
        "Restrict access to the affected area"
      ]
    }

    if (incidentType === "Electrical Fault") {
      return [
        "Isolate and lock out the electrical supply",
        "Prevent unauthorized access",
        "Allow inspection only by authorized personnel",
        "Verify the system is safe before restoring power"
      ]
    }

    if (incidentType === "Conveyor Accident") {
      return [
        "Stop the conveyor immediately",
        "Isolate and lock out the machinery",
        "Prevent unexpected restart",
        "Inspect the equipment before returning it to service"
      ]
    }

    return [
      "Stop or control the unsafe activity",
      "Keep workers away from the affected area",
      "Notify the responsible supervisor",
      "Assess the hazard before work resumes"
    ]
  }

 const assessIncident = async () => {
  try {
    const response = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        incident_type: incidentType,
        severity: severity,
        workers_at_risk: workersAtRisk,
        injured_count: injuredCount,
        hazard_intensity: hazardIntensity,
        workers_in_danger_zone: workersInDangerZone,
        nearest_worker_distance_m: nearestWorkerDistance,
        communication_status: communicationStatus,
        rescue_response_time_min: rescueResponseTime,
        time_since_incident_min: timeSinceIncident,
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const result = await response.json()

    console.log("ML RESULT:", result)

    setPriority(result.priority)
    setConfidence(result.confidence * 100)

  } catch (error) {
    console.error("Error connecting to ML model:", error)
  }
}
  return (
    <>
      <div>
        <h1> Operations Dashboard</h1>

      <section>
        <h2>MINE STATUS</h2>
        <div className='mine-status'> 
        <div>
          <h3>Production</h3>
          <p>82%</p>
        </div>

        <div>
          <h3>Equipment</h3>
          <p>Operational</p>
        </div>

        <div>
          <h3>Workforce</h3>
          <p>124 workers</p>
        </div>

        <div>
          <h3>Status</h3>
          <p>Active</p>
        </div>
        </div>
      </section>
      <section className="shift-safety">
  <div>
    <h2>CURRENT SHIFT</h2>
    <h3>Morning</h3>
    <p>Supervisor: Alex</p>
    <p>Handover: ✓</p>
  </div>

  <div>
    <h2>SAFETY OVERVIEW</h2>
    <p>🔴 Critical: 2</p>
    <p>🟠 High: 4</p>
    <p>🟡 Medium: 6</p>
  </div>
</section>
<section className="active-alerts">
  <h2>🚨 ACTIVE ALERTS</h2>

  <div>
    <p>🔴 High methane detected — Zone B</p>
    <p>🔴 Conveyor failure — Section 4</p>
  </div>
</section>
<section className="bottom-section">
  <div>
    <h2>RECENT INCIDENTS</h2>
    <p>Equipment failure</p>
    <p>Minor injury</p>
    <p>Ventilation issue</p>
  </div>

  <div>
    <h2>SIMULATION STATE</h2>
    <p>● Running</p>
    <p>Scenario: Gas Leak</p>
    <p>Progress: 68%</p>
  </div>
</section>
<section className="assessment">

  {/* LEFT — INCIDENT FORM */}
  <div className="form-card">
    <div className="form-heading">
      <span className="form-icon">🚨</span>
      <div>
        <h2>INCIDENT REPORT</h2>
        <p>Report the current safety condition</p>
      </div>
    </div>

    {/* INCIDENT DETAILS */}
    <div className="form-group">
      <h3>Incident Details</h3>

      <label>
        Incident Type
        <select
          value={incidentType}
          onChange={(e) => setIncidentType(e.target.value)}
        >
          <option value="">Select incident type</option>
          <option value="Gas Leak">Gas Leak</option>
          <option value="Fire">Fire</option>
          <option value="Roof Fall">Roof Fall / Ground Failure</option>
          <option value="Water Ingress">Water Ingress</option>
          <option value="Electrical Fault">Electrical Fault</option>
          <option value="Conveyor Accident">
            Conveyor Accident
          </option>
          <option value="Other">Other</option>
        </select>
      </label>

      <label>
        Severity
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
        >
          <option value="">How serious is the incident?</option>
          <option value="Minor">Minor</option>
          <option value="Moderate">Moderate</option>
          <option value="Serious">Serious</option>
          <option value="Critical">Critical</option>
        </select>
      </label>
    </div>

    {/* PEOPLE AT RISK */}
    <div className="form-group">
      <h3>People at Risk</h3>

      <div className="input-row">
        <label>
          Workers at Risk
          <input
            type="number"
            min="0"
            placeholder="0"
            value={workersAtRisk}
            onChange={(e) =>
              setWorkersAtRisk(Number(e.target.value))
            }
          />
          <small>Everyone potentially affected</small>
        </label>

        <label>
          Injured Count
          <input
  type="number"
  min="0"
  placeholder="0"
  value={injuredCount}
  onChange={(e) => setInjuredCount(Number(e.target.value))}
/>
          <small>Workers currently injured</small>
        </label>
      </div>

      <div className="input-row">
        <label>
          Workers in Danger Zone
          <input
  type="number"
  min="0"
  placeholder="0"
  value={workersInDangerZone}
  onChange={(e) => setWorkersInDangerZone(Number(e.target.value))}
/>
          <small>Currently inside hazardous area</small>
        </label>

        <label>
          Nearest Worker Distance
          <div className="unit-input">
            <input
  type="number"
  min="0"
  placeholder="0"
  value={nearestWorkerDistance}
  onChange={(e) => setNearestWorkerDistance(Number(e.target.value))}
/>
            <span>m</span>
          </div>
          <small>Distance from hazard</small>
        </label>
      </div>
    </div>

    {/* HAZARD MEASUREMENTS */}
    <div className="form-group">
      <h3>Environmental / Hazard Measurements</h3>

      <p className="helper-text">
        Enter available measurements. The system will calculate hazard
        intensity automatically.
      </p>

      <div className="input-row">
        
            <label>
  Hazard Intensity
  <input
    type="number"
    min="0"
    max="100"
    value={hazardIntensity}
    onChange={(e) => setHazardIntensity(Number(e.target.value))}
  />
  <small>Hazard intensity score (0–100)</small>
</label>
        <label>
          Environmental Warning
          <select>
            <option>NO</option>
            <option>YES</option>
          </select>
        </label>
      </div>
    </div>

    {/* RESPONSE */}
    <div className="form-group">
      <h3>Emergency Response</h3>

      <select
  value={communicationStatus}
  onChange={(e) => setCommunicationStatus(e.target.value)}
>
  <option value="">Select status</option>
  <option value="Normal">🟢 Normal</option>
  <option value="Degraded">🟡 Degraded</option>
  <option value="Lost">🔴 Lost</option>
</select>

      <label>
        Estimated Rescue Response Time
        <div className="unit-input">
          <input
  type="number"
  min="0"
  placeholder="0"
  value={rescueResponseTime}
  onChange={(e) => setRescueResponseTime(Number(e.target.value))}
/>
          <span>min</span>
        </div>
        <small>Estimated time for rescue team to reach location</small>
      </label>
    </div>
<label>
  Time Since Incident
  <div className="unit-input">
    <input
      type="number"
      min="0"
      placeholder="0"
      value={timeSinceIncident}
      onChange={(e) => setTimeSinceIncident(Number(e.target.value))}
    />
    <span>min</span>
  </div>
</label>
    <button
  className="assess-button"
  onClick={assessIncident}
>
  ASSESS INCIDENT →
</button>
  </div>


  {/* RIGHT — LIVE PREVIEW */}
  <div className="preview-card">

    <div className="preview-heading">
      <span>◉</span>
      <div>
        <h2>LIVE RISK ASSESSMENT</h2>
        <p>Real-time incident analysis</p>
      </div>
    </div>

   {priority === "" ? (
  <div className="risk-placeholder">
    <div className="risk-symbol">⚠</div>

    <h3>AWAITING INCIDENT DATA</h3>

    <p>
      Complete the incident details and assess the
      incident to generate a risk assessment.
    </p>
  </div>
  ) : (
  <div className="risk-result">

    <div className="priority-box">
  <span>INCIDENT PRIORITY</span>
  <strong>{priority}</strong>
</div>

<div className="confidence-box">
  <span>MODEL CONFIDENCE</span>
  <strong>{confidence}%</strong>
</div>

    <div className="measures">
      <h3>RECOMMENDED SAFETY MEASURES</h3>

      {getSafetyMeasures().map((measure, index) => (
        <div className="measure" key={index}>
          <span>✓</span>
          <p>{measure}</p>
        </div>
      ))}
    </div>

  </div>
)}
    <div className="hazard-score">
      <div>
        <span>Calculated Hazard Intensity</span>
        <strong>—</strong>
      </div>

      <div className="score-bar">
        <div></div>
      </div>
    </div>

    <div className="prediction-note">
      <span>🤖</span>
      <p>
        ML prediction will appear here once the
        incident assessment is submitted.
      </p>
    </div>

  </div>

</section>
      </div>
    </>
  )
}

export default App
