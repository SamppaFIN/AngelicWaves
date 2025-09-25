# 🧠 Project Knowledge Base - AngelicWaves
*Architecture, endpoints, and operations*

**Last Updated:** 2025-09-25  
**Project:** AngelicWaves – Angelic Frequency Detector

---

## 🌟 Overview

AngelicWaves is a real-time frequency detection and analysis app that identifies “angelic” reference frequencies and provides AI-powered insights. This document summarizes the system architecture, API surface, and an operational runbook for deployments.

---

## 🏗️ Technical Architecture

### Frontend Stack
- React + TypeScript + Vite
- TailwindCSS + Shadcn/ui
- React Query for client data/state
- Web Audio API + FFT for spectrum analysis

### Backend Stack
- Node.js 18+ (TypeScript)
- Express.js HTTP API
- Local/in-memory storage module for frequency reports
- Optional external AI analysis via Perplexity API (`PERPLEXITY_API_KEY`)

### Build & Deploy
- Dockerfile builds client and serves via the Node server
- Azure Container Registry (ACR) for image hosting
- Azure Container Instances (ACI) or Azure Container Apps for runtime

---

## 📁 Project Structure

```
AngelicWaves/
├── client/                 # React client
│   └── src/
│       ├── components/     # UI components
│       ├── hooks/          # Audio analyzer, etc.
│       ├── lib/            # Analysis utilities
│       └── pages/          # Route pages
├── server/                 # Express server (TypeScript)
│   ├── index.ts            # Server bootstrap and static serving
│   ├── routes.ts           # API routes and handlers
│   └── vite.ts             # Dev server integration
├── shared/                 # Cross-shared types/schemas
│   └── schema.ts           # Zod schemas and TS types
├── docs/                   # Project documentation (this file inside)
├── tests/                  # Security, API, and UI tests
├── Dockerfile              # Production build image
├── docker-compose.yml      # Local compose config
└── aci-deployment.yml     # ACI template referencing ACR image
```

Key entries:
- Client: `client/src/App.tsx`, `client/src/pages/Home.tsx`
- Server: `server/index.ts`, `server/routes.ts`
- Types/Schemas: `shared/schema.ts`

---

## 🔌 API Endpoints (Server)

Base URL: `http://<host>:5000`

- POST `/api/frequency-reports`
  - Body: `insertFrequencyReportSchema` (see `shared/schema.ts`).
  - Behavior: Saves a frequency report. If `analysis` is empty, the server generates one. If `isPublic === 1`, report is marked shareable.
  - Responses: `201 { report }` | `400 { message, errors }` | `500 { message }`.

- GET `/api/frequency-reports`
  - Returns all saved frequency reports.
  - Responses: `200 [ reports ]` | `500 { message }`.

- GET `/api/frequency-reports/shared/:shareId`
  - Returns a public report by `shareId` (404 if not found or not public).
  - Responses: `200 { report }` | `400 { message }` | `404 { message }` | `500 { message }`.

- GET `/api/analyze?frequencies=<json>`
  - Query param: `frequencies` is a JSON array of `{ frequency, duration, timestamp }`.
  - Returns built-in (offline) textual analysis.
  - Responses: `200 { analysis }` | `400 { message }` | `500 { message }`.

- POST `/api/analyze-frequencies`
  - Body: `{ detectedFrequencies?, dominantFrequencies?, userContext? }`.
  - Uses Perplexity API when `PERPLEXITY_API_KEY` is set; otherwise returns a fallback message.
  - Responses: `200 { analysis }` | `400 { message }` | `500 { message, error, analysis }`.

Notes:
- `/api/*` responses are logged (truncated) with method, path, status, and brief JSON.
- Server listens on port `5000` by default (`PORT` env respected). Docker exposes `5000`.

---

## 🎛 Client Highlights

- `components/FrequencyVisualizer.tsx`: Live spectrum visualization
- `components/AngelicFrequencies.tsx`: Reference tones (432, 528, 639, 741, 963 Hz)
- `hooks/useAudioAnalyzer.ts`: Microphone capture and FFT analysis
- `lib/frequencyAnalysis.ts`: Utility functions for analysis logic

---

## ♻️ Operational Runbook

### Local Development
```
npm install
npm run dev
```

### Build Container Image
```
docker build -t angelicwaves:local .
```

### Push to Azure Container Registry (ACR)
```
az acr login --name angelicwavesacr
docker build -t angelicwavesacr.azurecr.io/angelic-waves:latest .
docker push angelicwavesacr.azurecr.io/angelic-waves:latest
# Alternative (cloud build):
az acr build --registry angelicwavesacr --image angelic-waves:latest .
```

### Deploy to Azure Container Instances (ACI)
- Ensure `aci-deployment.yml` references `angelicwavesacr.azurecr.io/angelic-waves:latest` and exposes port `5000`.
```
az container create \
  --resource-group angelic-waves-rg \
  --file aci-deployment.yml
```

### Health & Troubleshooting
- Health check (compose example): GET `/api/frequency-reports` returns 200.
- Logs: `az container logs --resource-group <rg> --name angelic-waves-aci`.
- Validate tags: `az acr repository show-tags --name angelicwavesacr --repository angelic-waves`.
- Common: Ensure `PERPLEXITY_API_KEY` exists only when using AI endpoint.

---

## 🔐 Security & Compliance Notes
- API input validation via Zod (`shared/schema.ts`).
- Tests include API fuzzing and UI security checks (`tests/security/*`).
- Minimal PII; user-provided audio analysis should be handled per GDPR guidance in docs.

---

## 📊 Status & Roadmap (High Level)
- Core features implemented: detection, visualization, report storage, basic analysis, public sharing, optional AI analysis.
- Next: consolidate API docs into OpenAPI, add e2e tests for sharing flow, document rollback steps for ACI.

---

## 📚 Related Documents
- `docs/README.md` – Docs index and usage
- `docs/AURORA_LOG.md` – Session history and decisions
- `docs/DEVELOPMENT_GUIDELINES.md` – Engineering standards
- `docs/MVP_CSS_LIBRARIES.md` – UI system and styles
- `docs/CURSOR_RULES.md` – Collaboration guidelines


---

*This knowledge base serves as the comprehensive foundation for understanding and developing Eldritch Sanctuary. May it guide the cosmic journey toward its highest potential of community healing and wisdom sharing.* ✨🌌

**Last Updated:** 2025-01-24  
**Next Focus:** Mobile button functionality and inventory revolution  
**Sacred Mission:** Community healing through cosmic exploration
