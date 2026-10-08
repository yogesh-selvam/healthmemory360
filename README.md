# HealthMemory 360 — Functional Full-Stack Hackathon Build

**Remember your health. Understand your journey. Live better.**

This build keeps the supplied Stitch HTML screens as the visual source of truth and adds the functional application layer around them: JWT authentication, MongoDB persistence, medical-record upload/extraction, timeline aggregation, report comparison, record-grounded AI, reminders, contextual alerts, emergency preparation, Doctor Brief generation, and Health Sphere.

## Stack

- Frontend: React 19 + TypeScript + Vite + React Router + Lucide
- Backend: Node.js + Express + TypeScript
- Database: MongoDB + Mongoose
- Authentication: bcrypt + JWT
- Uploads: Multer
- AI: Mock provider by default; optional Gemini/OpenAI provider through backend environment variables

## Demo credentials

The Stitch login is wired to the seeded account:

- Email: `alex.morgan@healthmail.com`
- Password: `ClinicalVault2025#`
- Demo patient: **Alex Morgan**, age 24

All seeded values are synthetic hackathon data.

## 1. Prerequisites

- Node.js 20+
- MongoDB running locally on port 27017, or a MongoDB Atlas connection string

## 2. Environment

Copy the backend example:

```powershell
Copy-Item backend\.env.example backend\.env
```

Set a real JWT secret in `backend/.env`.

For optional AI:

```env
AI_PROVIDER=mock
AI_API_KEY=
AI_MODEL=
```

Use `AI_PROVIDER=gemini` or `AI_PROVIDER=openai` only when the corresponding API key is configured. Keys stay on the backend.

## 3. Install

From the project root:

```powershell
npm install
npm --prefix backend install
npm --prefix frontend install
```

## 4. Seed MongoDB

Make sure MongoDB is running, then:

```powershell
npm run seed
```

Expected output:

```text
Seed complete: alex.morgan@healthmail.com / ClinicalVault2025#
```

## 5. Start

```powershell
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend health:

```text
http://localhost:5000/api/health
```

If Vite chooses port 5174, the backend already allows both 5173 and 5174.

## Functional demo flow

```text
Landing
  ↓
Login
  ↓
JWT authentication
  ↓
Dashboard
  ↓
Medical Records
  ↓
Upload PDF/JPG/PNG
  ↓
Backend extraction
  ↓
AI review screen
  ↓
Health Timeline
  ↓
Report Comparison
  ↓
Ask HealthMemory
  ↓
Smart Reminders
  ↓
Health Alerts
  ↓
Emergency / SOS
  ↓
Doctor Brief
  ↓
Health Sphere
```

## Backend API groups

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Health / dashboard

- `GET /api/dashboard`
- `GET /api/timeline`
- `GET /api/records`
- `GET /api/records/:id`
- `POST /api/records`
- `DELETE /api/records/:id`
- `POST /api/records/upload`
- `POST /api/reports/compare`

### Tracking

- `/api/fitness`
- `/api/nutrition`
- `/api/mental-wellness`
- `/api/physical-health`
- `/api/medications`
- `/api/conditions`
- `/api/appointments`

### AI / Doctor Brief

- `POST /api/ai/chat`
- `POST /api/doctor-brief/generate`

### Reminders / alerts / notifications

- `/api/reminders`
- `POST /api/reminders/from-record/:id`
- `GET /api/alerts`
- `/api/notifications`

### Emergency

- `/api/emergency/profile`
- `POST /api/emergency/sos`
- `/api/emergency/events`

The SOS flow prepares a patient-controlled emergency card. It does not dispatch an ambulance.

### Health Sphere

- `GET /api/community/posts`
- `POST /api/community/posts`
- `POST /api/community/posts/:id/like`
- `/api/community/posts/:id/comments`
- `POST /api/community/follow/:userId`

## Stitch UI preservation

The original screens are preserved in two places:

- `frontend/public/stitch/` — served by Vite
- `stitch-source/` — visual source/reference package

The login wrapper was corrected from an outer `max-w-md` constraint to the intended `max-w-5xl` so the supplied split-screen design renders at its intended width.

Do not replace these screens with a generic dashboard. The supplied Stitch designs remain the visual source of truth.

## Healthcare safety boundary

HealthMemory 360 is a health-information management and decision-support prototype. It organizes records, compares stored values, summarizes stored information, and helps users prepare for clinical conversations. It must not diagnose, prescribe, or claim to replace a clinician.

## Build

```powershell
npm run build
```

A successful build is required before claiming the project is ready for deployment.
