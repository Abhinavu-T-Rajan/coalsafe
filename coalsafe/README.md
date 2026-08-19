# COALSAFE

> **SIH1645**: An app and web based software for Productivity and Safety Management of Coal Mines  
> **Digital Mine Operations, Shift Handover & Safety Management Platform**

COALSAFE is a digital mining safety platform designed to streamline shift handovers, log critical safety parameters, enforce compliance, flag hazards in real time, and automate regulatory reporting across coal mining operations.

---

## Architecture

```text
Next.js (Web Frontend :3000)
   ↓
FastAPI (Backend API :8000)
   ↓
PostgreSQL (Database :5432 via Docker)
```

---

## Development Services

| Service | Protocol / URL | Description |
| :--- | :--- | :--- |
| **Frontend** | [http://localhost:3000](http://localhost:3000) | Next.js App Router Web UI |
| **Backend** | [http://localhost:8000](http://localhost:8000) | FastAPI REST API |
| **Swagger Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive OpenAPI documentation |
| **PostgreSQL** | `localhost:5432` | Containerized PostgreSQL (database: `coalsafe`, user: `coalsafe`) |

---

## Prerequisites

- **Node.js** >= 18.x
- **pnpm** >= 9.x
- **Python** >= 3.11
- **uv** (recommended Python package manager)
- **Docker Desktop** (for PostgreSQL)

---

## Setup & Local Development (Windows / PowerShell)

### 1. Install Workspace & Frontend Dependencies
From the repository root (`coalsafe/`):
```powershell
pnpm install
```

### 2. Start PostgreSQL Database
```powershell
docker compose up -d
```
Verify the container is healthy:
```powershell
docker compose ps
```

### 3. Set Up Python Backend Environment
Navigate to `apps/api`:
```powershell
cd apps\api
uv venv
.\.venv\Scripts\Activate.ps1
uv pip install -e ".[dev]"
```

Run Alembic database migration check:
```powershell
alembic upgrade head
```

### 4. Start the FastAPI Backend Server
```powershell
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
API health endpoint: [http://localhost:8000/health](http://localhost:8000/health)

### 5. Start the Next.js Frontend
In a separate PowerShell terminal (from repository root):
```powershell
pnpm dev:web
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Monorepo Layout

```text
coalsafe/
├── apps/
│   ├── web/                     # Next.js App Router (TypeScript, Tailwind CSS)
│   └── api/                     # FastAPI Backend (SQLAlchemy 2.x, Alembic, psycopg)
├── packages/
│   └── types/                   # Shared TypeScript type definitions
├── docker-compose.yml           # PostgreSQL container setup
├── package.json                 # Monorepo root workspace config
├── pnpm-workspace.yaml          # pnpm workspace definition
├── .env.example                 # Environment variables template
└── README.md                    # Project documentation
```
