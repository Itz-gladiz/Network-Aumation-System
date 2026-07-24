# NetDevOps Backend

Django + DRF API for the NetDevOps platform. Runs out of the box on SQLite — no Postgres or Redis required to get started.

## Run it (first time)

```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

python manage.py migrate
python manage.py seed_demo      # creates demo users + devices so the UI isn't empty
python manage.py runserver
```

The API is now at **http://127.0.0.1:8000/api/**. Django admin is at **http://127.0.0.1:8000/admin/**.

## Demo logins (created by `seed_demo`)

| Username | Password | Role |
|---|---|---|
| admin | admin12345 | Administrator |
| engineer | engineer12345 | Network Engineer |
| viewer | viewer12345 | Viewer |

## Next time you run it

You only need:
```bash
cd backend
venv\Scripts\activate      # or: source venv/bin/activate
python manage.py runserver
```

## Connecting the frontend

In `frontend/.env`, make sure:
```
VITE_API_BASE_URL=http://localhost:8000/api
```
Then `npm run dev` in the frontend folder. Login with one of the demo accounts above.

## Endpoints implemented

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/api/auth/login/` | returns `access` + `refresh` JWT |
| POST | `/api/auth/refresh/` | refresh access token |
| GET | `/api/auth/me/` | current user + role |
| GET/POST/PATCH/DELETE | `/api/devices/` | Viewer = read-only |
| POST | `/api/devices/{id}/test_connection/` | live SSH test via Netmiko (needs `netmiko` installed + a reachable device) |
| GET | `/api/backups/` | list |
| POST | `/api/backups/backup_selected/` | runs a real `show running-config` backup per selected device |
| GET/POST | `/api/deployments/`, `/api/deployments/deploy_now/` | pushes config via `send_config_set` |
| GET | `/api/logs/` | audit trail, auto-filled by every action above |
| GET | `/api/dashboard/summary/` | powers the dashboard cards/charts |

## What's stubbed vs. real

- **Real**: auth, RBAC, device CRUD, encrypted credential storage, dashboard aggregation, audit logging, SSH backup/deploy calls (they'll actually run if you point them at a real or lab device with `netmiko` installed).
- **Stubbed for later** (see the earlier phased SRS guide for how to fill these in): Git-backed backup versioning/restore/diff (`gitpython`), async/bulk execution via Celery + Redis for 100+ devices, CSV log export.

## Switching to PostgreSQL

In `.env`, set:
```
DB_ENGINE=postgresql
DB_NAME=netdevops
DB_USER=...
DB_PASSWORD=...
DB_HOST=localhost
```
Then re-run `python manage.py migrate`.
