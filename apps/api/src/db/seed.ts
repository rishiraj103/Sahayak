import 'dotenv/config';
import { Pool } from 'pg';
import { seededApplications } from '../domain/fixtures.js';
import { RULE_VERSION } from '../domain/rules.js';
import { randomUUID } from 'node:crypto';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
for (const app of seededApplications) {
  await pool.query('INSERT INTO applications (id, application_number, submission_date, service_type, status, current_stage, last_updated_at, fallback_explanation) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (application_number) DO UPDATE SET submission_date=EXCLUDED.submission_date, service_type=EXCLUDED.service_type, status=EXCLUDED.status, current_stage=EXCLUDED.current_stage, last_updated_at=EXCLUDED.last_updated_at, fallback_explanation=EXCLUDED.fallback_explanation', [app.id, app.applicationNumber, app.submissionDate, app.serviceType, app.status, app.currentStage, app.lastUpdatedAt, app.fallbackExplanation]);
  await pool.query('DELETE FROM application_stages WHERE application_id = $1; DELETE FROM citizen_actions WHERE application_id = $1', [app.id]);
  for (const stage of app.stages) await pool.query('INSERT INTO application_stages (id, application_id, stage, position, state, started_at, completed_at, expected_max_days) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [randomUUID(), app.id, stage.stage, stage.position, stage.state, stage.startedAt, stage.completedAt, stage.expectedMaxDays]);
  if (app.action) await pool.query('INSERT INTO citizen_actions (id, application_id, required, description, active) VALUES ($1,$2,$3,$4,$5)', [randomUUID(), app.id, app.action.required, app.action.description, app.action.active]);
  await pool.query('INSERT INTO explanation_cache (id, application_id, locale, rule_version, explanation, source) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (application_id, locale, rule_version) DO UPDATE SET explanation=EXCLUDED.explanation, source=EXCLUDED.source', [randomUUID(), app.id, 'en', RULE_VERSION, app.fallbackExplanation, 'seeded']);
}
await pool.end(); console.log('Synthetic applications seeded.');
