# VERA — Data Intelligence Platform

A full-stack data intelligence platform for uploading, managing, and analyzing CSV/JSON datasets with role-based authentication, real-time notifications, and graph-based relationship visualization.

## Quick Start (Docker — Recommended)

```bash
git clone <your-repo-url>
cd vera-platform

# Copy env file
cp .env.example .env

# Start everything (PostgreSQL + Neo4j + Backend + Frontend)
docker-compose up -d

# View logs
docker-compose logs -f
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Neo4j Browser | http://localhost:7474 |

### Test Credentials
```
Email:    demo@vera.com
Password: Demo1234!
```
> Create the test account via the Signup page or POST /register

---

## Features

### Core (All 4 Tasks)
- **Task 1 — Data Ingestion**: Drag-and-drop CSV/JSON upload, file validation (<50MB), progress bar
- **Task 2 — Data Management**: Paginated records table, debounced search, edit/delete per row, bulk delete
- **Task 3 — Analytics Engine**: Auto-generated stats (mean, median, std, quartiles), IQR anomaly detection, insight text, Bar/Pie/Line/Histogram charts
- **Task 4 — Authentication**: JWT login/signup, bcrypt (cost=12) passwords, role-based access (Admin/User)

### Bonus
- **Real-time WebSockets** — upload/analysis/delete notifications pushed to the UI via `/ws/{user_id}`
- **Graph Visualization** — interactive force-directed graph (d3-force) mapping relationships between datasets and their columns; powered by Neo4j
- **Docker Setup** — one-command startup: PostgreSQL + Neo4j + FastAPI + React/Nginx
- **Alembic Migrations** — versioned database schema management
- **Logging System** — rotating file logger (10MB, 5 files) at `logs/vera.log`
- **Dark/Light Mode** — theme toggle persisted across sessions
- **API Docs** — Swagger UI at `/docs`

---

## Tech Stack

**Backend:** FastAPI · PostgreSQL · Neo4j · SQLAlchemy · Alembic · JWT (python-jose) · bcrypt · Pandas · NumPy

**Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · Recharts · d3-force · Axios · React Router v6

**DevOps:** Docker · Docker Compose · Nginx

---

## Manual Setup (without Docker)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env — set DATABASE_URL to your local PostgreSQL

uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install

cp .env.example .env
# VITE_API_URL=http://localhost:8000

npm run dev   # runs on http://localhost:3001
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /register | Public | Register user |
| POST | /login | Public | Login, get JWT |
| GET | /me | JWT | Current user info |
| POST | /upload | JWT | Upload CSV/JSON |
| GET | /datasets | JWT | List datasets (paginated) |
| GET | /datasets/{id} | JWT | Dataset + 10-row preview |
| GET | /records?dataset_id= | JWT | Records (paginated, searchable) |
| PUT | /records/{id} | JWT | Update record |
| DELETE | /records/{id} | JWT | Delete record |
| DELETE | /dataset/{id} | JWT | Delete dataset + all records |
| POST | /analyze/{dataset_id} | JWT | Run analytics |
| GET | /graph | JWT | Dataset relationship graph data |
| WS | /ws/{user_id} | — | Real-time events |

---

## Sample Data

Upload these files from `sample_data/` to test:

### Simple
- `sales_data.csv` — 20 rows, date/product/quantity/price/region (includes anomaly on row 14)
- `users.json` — 15 employee records with salary, age, department
- `products.csv` — 15 product catalog entries

### Complex (stress-test analytics)
- `ecommerce_transactions.csv` — 600 rows, 20 columns: revenue, discounts, 6 regions, outlier quantities
- `stock_market_ohlcv.csv` — 360 rows, 5 tickers (AAPL/GOOGL/MSFT/TSLA/NVDA), OHLCV + TSLA crash & NVDA spike events
- `hospital_patients.json` — 400 records, 23 fields: BMI/BP outliers, 20% null cholesterol, ICU flags
- `iot_sensor_readings.csv` — 800 rows, 15-min intervals, 4 sensors, temperature anomalies, 4% null humidity
- `hr_employees.json` — 300 records, 18 fields: salary outliers ($450k–$900k), 10 departments, 9 levels

> Regenerate with: `python sample_data/generate.py`

---

## Project Structure

```
vera-platform/
├── backend/
│   ├── app/
│   │   ├── models/    # SQLAlchemy (User, Dataset, Record, AnalyticsResult)
│   │   ├── schemas/   # Pydantic validation
│   │   ├── routes/    # API endpoints (auth, upload, datasets, records, analytics, graph, websocket)
│   │   ├── services/  # Business logic (auth, upload, analytics, neo4j, ws_manager)
│   │   └── utils/     # Security, logging, validators
│   ├── tests/         # 161 tests across 7 files (pytest)
│   ├── alembic/       # Database migrations
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/ # FileUpload, DatasetCard, RecordsTable, Charts, AnalyticsDashboard, Navbar…
│   │   ├── pages/      # Login, Signup, Dashboard, Upload, Datasets, Analytics, Graph
│   │   ├── services/   # Axios API clients
│   │   ├── context/    # AuthContext, ThemeContext
│   │   └── hooks/      # useWebSocket, useDebounce
│   ├── src/test/       # 69 tests (Vitest + React Testing Library)
│   └── Dockerfile
├── sample_data/        # 8 test datasets (CSV + JSON) + generate.py
├── docker-compose.yml  # 4 services: postgres, neo4j, backend, frontend
└── README.md
```

---

## License

MIT
