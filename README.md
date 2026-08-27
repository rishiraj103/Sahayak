# Build What Moves India

Sahayak is a synthetic, citizen-side application-status translator for an Income Certificate workflow. It turns an opaque status into a plain-language explanation, the next action, and a mock grievance path when deterministic rules allow escalation.

This is a hackathon prototype. It uses only synthetic data and is not an official government service.


## Run locally

1. Copy `apps/api/.env.example` to `apps/api/.env` and `apps/web/.env.example` to `apps/web/.env`.
2. Run `docker compose up -d` to start PostgreSQL, then run `npm install`, `npm run db:migrate`, and `npm run db:seed`.
3. In separate terminals, run `npm run dev` for the API and `npm run dev:web` for the web app.
4. Open `http://localhost:5173` and choose a sample application. Leave `OPENAI_API_KEY` blank to verify the seeded explanation fallback.

Run `npm run build` and `npm run test` before committing changes.

## Deployment

Deploy the API and PostgreSQL database to Railway with the environment values from `apps/api/.env.example`; set `NODE_ENV=production` and the exact Vercel URL as `CORS_ORIGIN`. Run the migration and seed commands once against the Railway database before opening the public API.

Deploy the web app to Vercel and set `VITE_API_BASE_URL` to the public Railway API URL. The API must remain an always-on service; do not deploy it as a serverless function because grievances must persist.
