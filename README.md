# Volunteer Coordination System (MERN)

Mobile-first volunteer + event coordination tool for NGOs: volunteer profiles, events + shifts, smart assignment suggestions, hour logging + verification, CSV exports, and lightweight analytics.

## Tech

- Frontend: React (Vite) + Tailwind + React Query + Zustand + React Big Calendar + Framer Motion (no JSX)
- Backend: Node.js + Express + MongoDB (Mongoose) + JWT (access + refresh)

## Prereqs

- Node.js 18+
- MongoDB (local or Atlas)

## Setup

1) Install dependencies:

```bash
npm install
```

2) Backend env:

- Copy `backend/.env.example` → `backend/.env`

3) Frontend env:

- Copy `frontend/.env.example` → `frontend/.env`

4) Seed an initial admin (recommended):

```bash
npm run seed
```

5) Start dev servers:

```bash
npm run dev
```

- API: `http://localhost:5000`
- Web: `http://localhost:5173`

## Production

Build:

```bash
npm run build
```

Run API:

```bash
npm start -w backend
```

Serve frontend `frontend/dist` with a static host (Netlify/Vercel/S3+CloudFront) or your preferred web server.

## API (high level)

- Auth: `/api/auth/*`
- Volunteers: `/api/volunteers/*`
- Events: `/api/events/*`
- Assignments: `/api/assignments/*`
- Hours: `/api/hours/*`
- Reports (CSV): `/api/reports/*`
- Analytics: `/api/analytics/*`

## Notes

- Refresh token is stored in an HttpOnly cookie (safer on the web). Access token is used as a Bearer token for API calls.
- Assignment creation prevents shift overlaps per volunteer.
