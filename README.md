# COALSAFE

**Digital Shift Handover & DGMS Safety Management Plan (SMP) Platform**  
*SIH1645 Hackathon Full Prototype*

---

## Overview

**COALSAFE** is a comprehensive, DGMS-compliant digital mining safety operating system developed for **Smart India Hackathon (SIH1645)**. It replaces paper-based colliery logbooks and manual risk assessments with an integrated digital workflow:

1. **Digital Shift Handover Log System (Pillar 1):**
   - Statutory logbook formats under Coal Mines Regulations (CMR) 2017: **Overman (Reg 48)**, **Mining Sirdar (Reg 47)**, **Ventilation Officer (Reg 51)**, **Electrical/Mechanical Engineers (Reg 53)**, and **HEMM Equipment Operators**.
   - **Critical Red Flag Alerting**: Highlights safety hazards for mandatory incoming supervisor briefing and digital acceptance before taking handover.
   - **Automated Statutory PDF Reports**: Instant generation and download of formatted colliery reports with non-repudiation digital signatures.
2. **Safety Management Plan (SMP) as per DGMS Guidelines (Pillar 2):**
   - Implements **DGMS Circular No. 02 of 2011** and **CMR 2017 Reg 104**.
   - **Interactive 5x5 Consequence × Likelihood Risk Matrix** & Risk Priority Number (RPN) calculator.
   - **Hierarchy of Controls**: Elimination, Substitution, Engineering, Administrative, and PPE.
   - **Trigger Action Response Plans (TARP)**: Level 1 (Normal Green), Level 2 (Trigger Yellow), and Level 3 (Action Red).
   - **Accountable Colliery Officials Matrix** with statutory inspection schedules.
3. **Underground Mine Safety Simulation Engine (Phase 3):**
   - Pure Python deterministic physics engine modeling gas diffusion ($CH_4, CO, O_2$), ventilation fan sweeping, water inrush, roof convergence, and autonomous miner evacuation AI.
   - 5 calibrated disaster scenarios with emergency command & control intervention bar and post-incident DGMS audit scoring (Grade S/A/B/C/F).
4. **ERP Integration Bridge & Cryptographic Audit (Pillar 3):**
   - Bi-directional connector syncing shift logs, coal production tonnage, worker attendance, and machine downtime with **SAP S/4HANA & Coal Net**.
   - **SHA-256 Cryptographic Non-Repudiation Ledger** preventing retroactive log tampering.

---

## Architecture

```text
Next.js 14 (App Router, Tailwind CSS, TypeScript)
   ↓  (REST API / PDF Streams)
FastAPI (Python, Pydantic v2, ReportLab, SQLAlchemy 2.x, Alembic)
   ↓
PostgreSQL 16 (Docker Compose)
   ↓
SAP / Coal Net ERP Bridge (Cryptographic Audit Ledger)
```

---

## Services & Endpoints

| Service | Technology | Local URL / Connection |
| :--- | :--- | :--- |
| **Unified Web Portal** | Next.js 14 App Router | [http://localhost:3000](http://localhost:3000) |
| **Backend REST API** | FastAPI + Uvicorn | [http://localhost:8000](http://localhost:8000) |
| **Interactive API Docs**| OpenAPI / Swagger UI | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **Database** | PostgreSQL 16 | `localhost:5432` (DB: `coalsafe`, User: `coalsafe`) |

---

## Repository Structure

```text
coalsafe/
├── apps/
│   ├── web/                              # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/                      # Main unified portal
│   │   │   ├── components/
│   │   │   │   ├── handover/             # Digital Shift Handover Dashboard & Sign-off
│   │   │   │   ├── smp/                  # DGMS SMP & 5x5 HIRA Matrix
│   │   │   │   ├── erp/                  # ERP Sync Hub & Cryptographic Audit
│   │   │   │   └── simulation/           # Phase 3 Mine Map, Telemetry & Controls
│   │   │   └── lib/api.ts                # Typed API client
│   │   └── package.json
│   └── api/                              # FastAPI backend
│       ├── app/
│       │   ├── api/v1/                   # Shift Handover, SMP, Simulation, ERP routers
│       │   ├── shift_handover/           # Log service, Red flags & ReportLab PDF generator
│       │   ├── smp/                      # HIRA calculations, RPN matrix & TARP rules
│       │   ├── simulation/               # Pure Python physics & evacuation engine
│       │   ├── erp/                      # SAP bridge & SHA-256 audit ledger
│       │   ├── core/                     # Pydantic-settings config
│       │   └── db/                       # SQLAlchemy 2.x session & DeclarativeBase
│       ├── tests/                        # Pytest automated test suites
│       └── pyproject.toml                # uv-managed dependencies
├── packages/
│   └── types/                            # Shared TypeScript contracts (@coalsafe/types)
├── docker-compose.yml                    # PostgreSQL container definition
├── package.json                          # Monorepo root configuration
├── pnpm-workspace.yaml
├── .gitignore
├── .env.example
└── README.md
```

---

## Quickstart Setup (Windows / PowerShell)

### 1. Start Database Container
```powershell
docker compose up -d
docker compose ps
```

### 2. Install Workspace Dependencies
```powershell
# Install Node packages
pnpm install

# Install Python backend dependencies with uv
cd apps/api
uv sync --extra dev
uv run alembic upgrade head
cd ../..
```

### 3. Run Development Servers
Open two PowerShell terminals:

**Terminal 1 — Backend (FastAPI):**
```powershell
cd apps/api
uv run uvicorn app.main:app --reload --port 8000
```
*API available at `http://localhost:8000` & Swagger at `http://localhost:8000/docs`.*

**Terminal 2 — Frontend (Next.js):**
```powershell
pnpm dev:web
```
*Web Portal available at `http://localhost:3000`.*

---

## Automated Verification Suite

Run all verification tests across backend and frontend:

```powershell
# Backend Pytest Suite (10 tests)
cd apps/api
uv run pytest -v
uv run ruff check .

# Frontend TypeScript & Build Check
cd ../..
pnpm --filter web lint
pnpm --filter web build
```

---

## Statutory Standards Compliance

- **CMR 2017 Reg 47**: Duties & Responsibilities of Mining Sirdar.
- **CMR 2017 Reg 48**: Duties & Responsibilities of Overman.
- **CMR 2017 Reg 51**: Ventilation Inspection & Air Measurement.
- **CMR 2017 Reg 53**: Machinery, Flameproof FLP & Electrical Standards.
- **CMR 2017 Reg 104**: Safety Management Plan formulation.
- **CMR 2017 Reg 123**: Strata Control Management Plan (SCMP).
- **CMR 2017 Reg 144**: Spontaneous Combustion & Underground Fire Controls.
- **CMR 2017 Reg 149**: Danger from Inundation & Dewatering Capacity.
- **CMR 2017 Reg 153**: Statutory Methane Limits ($0.75\%$, $1.25\%$, $2.0\%$).
- **DGMS Circular No. 02 of 2011**: Guidelines for Hazard Identification & Risk Assessment (HIRA) & TARP.
