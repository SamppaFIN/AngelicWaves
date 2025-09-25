# 🧭 AngelicWaves Aurora Log
*Session history, decisions, and next steps*

---

## 2025-09-25

### Summary
- Added `docs/` with project-focused documentation.
- Rewrote `docs/README.md` to reflect AngelicWaves stack and usage.
- Documented workflow for pushing Docker images to Azure Container Registry (ACR).

### Changes
- `docs/README.md`: New AngelicWaves docs index and maintenance guidance.
- `Dockerfile`: Verified Node 18-alpine build and `npm start` run target.
- ACR usage: Confirmed registry `angelicwavesacr.azurecr.io` and image name `angelic-waves:latest` (see `aci-deployment.yml`).

### Deployment Notes
- Login: `az acr login --name angelicwavesacr`
- Build: `docker build -t angelicwavesacr.azurecr.io/angelic-waves:latest .`
- Push: `docker push angelicwavesacr.azurecr.io/angelic-waves:latest`
- Alternative: `az acr build --registry angelicwavesacr --image angelic-waves:latest .`

### Risks / Follow-ups
- Ensure `npm run build` succeeds in Docker on CI; cache `node_modules` if builds slow.
- Confirm port `5000` matches server `PORT` in `server/index.ts` and compose.
- If using Container Apps/ACI, verify health probe and ingress mapping.

### Next Steps
- Add short operational guide in `PROJECT_KNOWLEDGE_BASE.md` for local dev vs. prod.
- Document API endpoints in `PROJECT_KNOWLEDGE_BASE.md` (server `routes.ts`).
- Add a minimal runbook for ACI/Container Apps rollouts and rollbacks.

---

## 2025-09-24

### Summary
- Consolidated deployment configs (`aci-deployment.yml`, Dockerfile) and verified local dev.

### Notes
- Image reference standardized to `angelicwavesacr.azurecr.io/angelic-waves:latest`.

