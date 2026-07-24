# NetDevOps Frontend

React + Vite + Tailwind dashboard for the NetDevOps platform, matching the Devices / Backups / Deployments / Logs mockup.

## Setup

```bash
npm install
cp .env.example .env      # point VITE_API_BASE_URL at your Django backend
npm run dev
```

## Notes

- Every page falls back to bundled mock data (`src/mock/data.js`) if the API call fails, so the UI is fully explorable before the Django backend from the SRS guide is wired up. Remove the `.catch()` fallbacks once your endpoints are live.
- Auth: `src/context/AuthContext.jsx` stores JWT access/refresh tokens in `sessionStorage` and auto-refreshes on 401 via `src/api/client.js`.
- RBAC: wrap any admin/engineer-only control in `<RequireRole roles={["ADMIN","ENGINEER"]}>...</RequireRole>`.
- Add new pages by following the pattern in `src/pages/Devices.jsx` (Topbar + filters + DataTable + Modal) and registering the route in `src/App.jsx`.
