
<div align="center">

# AngelicWaves – Angelic Frequency Detector 🎵✨

Real-time audio analysis that highlights “angelic” frequencies (432, 528, 639, 741, 963 Hz), with visualizations, history, and optional AI insights.

</div>

---

## Highlights

- Real‑time frequency detection (Web Audio API + FFT)
- Beautiful visualizer and clear frequency meter
- Always‑visible Calculations explainer and History/References
- Optional AI analysis endpoint (Perplexity) with graceful fallback
- Demo/simulation modes for testing without a mic
- Shareable public reports (when enabled)

---

## Quick Start

### Run locally (dev)
```bash
git clone <your-fork-or-repo-url>
cd AngelicWaves
npm install
npm run dev
```
Open the URL printed in your terminal and allow microphone access when prompted.

### Run with Docker
```bash
docker build -t angelicwaves:local .
docker run -p 5000:5000 angelicwaves:local
```
Then open http://localhost:5000.

---

## Tech Stack

- Frontend: React + TypeScript + Vite, TailwindCSS, Shadcn/ui
- Backend: Express (TypeScript)
- Audio: Web Audio API + FFT analysis
- State: React Query

---

## Project Structure

```
├── client/                  # React client
│   └── src/
│       ├── components/     # UI components
│       ├── hooks/          # Audio analyzer, etc.
│       ├── lib/            # Utilities and analysis helpers
│       └── pages/          # Routes
├── server/                  # Express server
│   ├── index.ts            # Boot + static serving in prod
│   ├── routes.ts           # API endpoints
│   └── vite.ts             # Dev server integration
├── shared/                  # Shared types/schemas
│   └── schema.ts
└── docs/                    # Documentation hub
```

Key files:
- `client/src/components/FrequencyVisualizer.tsx`: Spectrum display
- `client/src/hooks/useAudioAnalyzer.ts`: Mic capture + FFT
- `server/routes.ts`: API routes (reports, analysis)

---

## API (brief)

- POST `/api/frequency-reports` → Save a report (auto‑generates analysis if not provided)
- GET `/api/frequency-reports` → List reports
- GET `/api/frequency-reports/shared/:shareId` → Public report by shareId
- GET `/api/analyze?frequencies=<json>` → Built‑in analysis
- POST `/api/analyze-frequencies` → AI analysis (requires `PERPLEXITY_API_KEY`)

---

## Deployment Notes

### Azure Container Registry (ACR)
```bash
az acr login --name angelicwavesacr
docker build -t angelicwavesacr.azurecr.io/angelic-waves:latest .
docker push angelicwavesacr.azurecr.io/angelic-waves:latest
# or: az acr build --registry angelicwavesacr --image angelic-waves:latest .
```

### Heroku (suggested setup)
- Add a `Procfile` with: `web: NODE_ENV=production node --loader tsx server/index.ts`
- Add a `heroku-postbuild` script to run `vite build`

---

## Privacy & Security

- Mic access is user‑consented and handled in‑browser
- Input validation via Zod schemas
- Security tests included under `tests/security`

---

## Contributing

Contributions are welcome! Please:
- Fork the repo and create a feature branch
- Add or update tests/docs where helpful
- Open a PR with a clear description and screenshots if UI changes

---

## License

MIT

---

Questions or ideas? Open an issue — we’d love to hear from you.
