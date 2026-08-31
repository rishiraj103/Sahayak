# Sahayak

> Understand your application, not just its status.

Sahayak is a citizen-facing application-status translator for a synthetic Income Certificate workflow. It converts opaque status codes into a plain-language explanation, highlights any action the applicant needs to take, shows what happens next, and enables a mock grievance when deterministic rules confirm that an application is delayed.

> [!IMPORTANT]
> Sahayak is a demonstration project built with synthetic data. It is not an official government service, does not connect to government systems, and must not be used for real applications.

## Features

- Plain-language application status and next-step guidance
- Deterministic delay, action, and escalation decisions
- Visual application-stage timeline
- Mock grievance creation with persistent reference numbers
- Optional OpenAI-generated explanations with strict schema validation
- Cached and seeded fallback explanations when AI is unavailable
- Responsive, accessible interface with explicit loading and error states
- PostgreSQL persistence in production and an in-memory repository for tests

## Architecture

```text
Citizen browser
      |
      v
React + Vite web app (Vercel)
      |
      | HTTPS / JSON
      v
Fastify API (Railway)
      |
      +--> Deterministic rules engine
      +--> PostgreSQL repository
      +--> Explanation cache
      +--> OpenAI Responses API (optional)
```

The rules engine is the source of truth for delay, action, and grievance eligibility. OpenAI is used only to translate verified synthetic facts into citizen-friendly wording; it never makes an eligibility or escalation decision.

## Technology stack

| Layer | Technology |
| --- | --- |
| Web | React 19, TypeScript, Vite, TanStack Query |
| API | Node.js 20+, Fastify, TypeScript, Zod |
| Database | PostgreSQL 16 |
| AI | OpenAI Responses API with structured JSON output |
| Testing | Vitest, Fastify injection tests |
| Deployment | Vercel for the web app, Railway for the API and PostgreSQL |

## Repository structure

```text
apps/
  api/                  Fastify API, rules, persistence, migrations and tests
    migrations/         PostgreSQL schema migrations
    src/domain/         Domain types, synthetic fixtures and decision rules
    src/db/             Migration and seed commands
  web/                  React application, API client and responsive UI
submission/             Demo and submission material
docker-compose.yml      Local PostgreSQL service
railway.json            Railway build and runtime configuration
vercel.json             Vercel web build configuration
```

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Docker Desktop or another PostgreSQL 16 installation

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the environment

Create local environment files from the included examples:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

On PowerShell, use `Copy-Item` instead of `cp` if the `cp` alias is unavailable.

The API works without an OpenAI key by returning seeded fallback explanations. Add `OPENAI_API_KEY` only when you want to test live explanation generation.

### 3. Start PostgreSQL and prepare the data

```bash
docker compose up -d
npm run db:migrate
npm run db:seed
```

### 4. Start the application

Run the API and web app in separate terminals:

```bash
npm run dev
```

```bash
npm run dev:web
```

Open `http://localhost:5173`.

## Demo applications

All records are synthetic and safe to use during development.

| Scenario | Application number | Submission date |
| --- | --- | --- |
| Delayed; grievance available | `INC-2026-01842` | `2026-08-16` |
| Applicant action required | `INC-2026-01843` | `2026-08-19` |
| Progressing normally | `INC-2026-01844` | `2026-08-24` |
| Certificate ready | `INC-2026-01845` | `2026-08-10` |

## Environment variables

### API

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Production | PostgreSQL connection string |
| `CORS_ORIGIN` | Production | Exact public web-app origin |
| `OPENAI_API_KEY` | No | Enables live AI-generated explanations |
| `OPENAI_MODEL` | No | OpenAI model used by the explanation service |
| `PORT` | No | API listening port; defaults to `3001` |
| `NODE_ENV` | Production | Set to `production` for deployed environments |

### Web

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | Public base URL of the Fastify API |

Never commit real API keys or production database credentials.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/healthz` | Service and database health check |
| `GET` | `/api/v1/applications/:applicationNumber` | Look up an application and its decision |
| `POST` | `/api/v1/applications/:applicationNumber/explanation` | Return a cached, generated, or seeded explanation |
| `POST` | `/api/v1/applications/:applicationNumber/grievances` | Create an eligible synthetic grievance |
| `GET` | `/api/v1/grievances/:grievanceNumber` | Retrieve a grievance by reference number |

Application endpoints expect `submissionDate=YYYY-MM-DD` as a query parameter.

## Quality checks

```bash
npm run build
npm run test
```

The test suite covers domain rules, application lookup, explanation fallback, grievance eligibility and persistence, validation, CORS normalization, and health behavior.

## Deployment

### API and database on Railway

1. Create a PostgreSQL service and an API service in the same Railway project.
2. Configure `DATABASE_URL`, `CORS_ORIGIN`, `NODE_ENV=production`, and optional OpenAI variables on the API service.
3. Run the database migration and seed commands once.
4. Generate a public domain for the API and confirm that `/healthz` returns `{"status":"ok"}`.

### Web app on Vercel

1. Import the repository as a Vercel project.
2. Keep the root configuration from `vercel.json`.
3. Set `VITE_API_BASE_URL` to the public Railway API URL.
4. Deploy and add the final Vercel origin to Railway's `CORS_ORIGIN`.

## Design and safety principles

- Deterministic code owns all decisions; AI only explains verified facts.
- Explanations are schema-validated and fall back safely on timeout or failure.
- The prototype does not upload documents or collect personal information.
- Rate limiting, strict input validation, CORS restrictions, and parameterized SQL reduce common API risks.
- Synthetic data and clear disclaimers prevent the interface from being mistaken for an official service.
