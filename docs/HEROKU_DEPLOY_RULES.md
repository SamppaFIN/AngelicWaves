# Heroku Deploy Rules — AngelicVoices

- Build a static bundle, then serve it with a minimal Node server.
- Required files/scripts:
  - package.json scripts:
    - heroku-postbuild: npm run build
    - start: node server.js
  - Procfile: web: npm run start
  - server.js: Express static server serving dist/ with SPA fallback
- Environment:
  - Node 18+ on Heroku (set in Settings → Buildpacks if needed)
- Common failure modes (H10 App crashed):
  - Missing start script → add start
  - No build step → add heroku-postbuild
  - Serving wrong directory → ensure vite build outputs to dist/ and server serves that folder
  - Dynamic routes 404 → add SPA fallback to index.html
- Redeploy steps:
  1. git push heroku main (or set GitHub integration and click Deploy)
  2. Check logs: heroku logs --tail
- Health check:
  - Open the app root / after successful dyno start
