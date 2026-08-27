import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import type { Application, Explanation, Grievance } from './domain/types.js';
import { seededApplications } from './domain/fixtures.js';

export interface Repository {
  getApplication(applicationNumber: string, submissionDate: string): Promise<Application | null>;
  getExplanation(applicationId: string, ruleVersion: string): Promise<Explanation | null>;
  saveExplanation(applicationId: string, ruleVersion: string, explanation: Explanation, source: 'seeded' | 'generated'): Promise<void>;
  createGrievance(application: Application): Promise<Grievance>;
  getGrievance(grievanceNumber: string): Promise<Grievance | null>;
  health(): Promise<boolean>;
}

export class MemoryRepository implements Repository {
  private readonly applications = seededApplications;
  private readonly explanations = new Map<string, Explanation>();
  private readonly grievances = new Map<string, Grievance>();
  private grievanceCounter = 1000;
  async getApplication(applicationNumber: string, submissionDate: string) { return this.applications.find((app) => app.applicationNumber === applicationNumber && app.submissionDate === submissionDate) ?? null; }
  async getExplanation(applicationId: string, ruleVersion: string) { return this.explanations.get(`${applicationId}:${ruleVersion}`) ?? null; }
  async saveExplanation(applicationId: string, ruleVersion: string, explanation: Explanation) { this.explanations.set(`${applicationId}:${ruleVersion}`, explanation); }
  async createGrievance(application: Application) { const grievanceNumber = `GRV-2026-${String(++this.grievanceCounter).padStart(6, '0')}`; const grievance = { grievanceNumber, applicationNumber: application.applicationNumber, status: 'SUBMITTED' as const, summary: 'Synthetic grievance: current application stage has exceeded its expected duration.', createdAt: new Date().toISOString() }; this.grievances.set(grievanceNumber, grievance); return grievance; }
  async getGrievance(grievanceNumber: string) { return this.grievances.get(grievanceNumber) ?? null; }
  async health() { return true; }
}

export class PostgresRepository implements Repository {
  private readonly pool: Pool;
  constructor(databaseUrl: string) { this.pool = new Pool({ connectionString: databaseUrl }); }
  async getApplication(applicationNumber: string, submissionDate: string): Promise<Application | null> {
    const result = await this.pool.query('SELECT * FROM applications WHERE application_number = $1 AND submission_date = $2', [applicationNumber, submissionDate]);
    const row = result.rows[0]; if (!row) return null;
    const stages = await this.pool.query('SELECT stage, position, state, started_at, completed_at, expected_max_days FROM application_stages WHERE application_id = $1 ORDER BY position', [row.id]);
    const action = await this.pool.query('SELECT required, description, active FROM citizen_actions WHERE application_id = $1 AND active = true LIMIT 1', [row.id]);
    return { id: row.id, applicationNumber: row.application_number, submissionDate: row.submission_date.toISOString().slice(0, 10), serviceType: row.service_type, status: row.status, currentStage: row.current_stage, lastUpdatedAt: row.last_updated_at.toISOString(), fallbackExplanation: row.fallback_explanation, stages: stages.rows.map((stage) => ({ stage: stage.stage, position: stage.position, state: stage.state, startedAt: stage.started_at?.toISOString() ?? null, completedAt: stage.completed_at?.toISOString() ?? null, expectedMaxDays: stage.expected_max_days })), action: action.rows[0] ?? null } as Application;
  }
  async getExplanation(applicationId: string, ruleVersion: string) { const result = await this.pool.query('SELECT explanation FROM explanation_cache WHERE application_id = $1 AND rule_version = $2 AND locale = $3', [applicationId, ruleVersion, 'en']); return result.rows[0]?.explanation ?? null; }
  async saveExplanation(applicationId: string, ruleVersion: string, explanation: Explanation, source: 'seeded' | 'generated') { await this.pool.query('INSERT INTO explanation_cache (id, application_id, locale, rule_version, explanation, source) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (application_id, locale, rule_version) DO UPDATE SET explanation = EXCLUDED.explanation, source = EXCLUDED.source, created_at = NOW()', [randomUUID(), applicationId, 'en', ruleVersion, explanation, source]); }
  async createGrievance(application: Application): Promise<Grievance> { const client = await this.pool.connect(); try { await client.query('BEGIN'); const sequence = await client.query("SELECT nextval('grievance_number_seq') AS value"); const grievanceNumber = `GRV-${new Date().getUTCFullYear()}-${String(sequence.rows[0].value).padStart(6, '0')}`; const createdAt = new Date().toISOString(); const summary = 'Synthetic grievance: current application stage has exceeded its expected duration.'; await client.query('INSERT INTO grievances (id, application_id, grievance_number, status, summary, created_at) VALUES ($1, $2, $3, $4, $5, $6)', [randomUUID(), application.id, grievanceNumber, 'SUBMITTED', summary, createdAt]); await client.query('COMMIT'); return { grievanceNumber, applicationNumber: application.applicationNumber, status: 'SUBMITTED', summary, createdAt }; } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); } }
  async getGrievance(grievanceNumber: string): Promise<Grievance | null> { const result = await this.pool.query('SELECT g.grievance_number, g.status, g.summary, g.created_at, a.application_number FROM grievances g JOIN applications a ON a.id = g.application_id WHERE g.grievance_number = $1', [grievanceNumber]); const row = result.rows[0]; return row ? { grievanceNumber: row.grievance_number, applicationNumber: row.application_number, status: row.status, summary: row.summary, createdAt: row.created_at.toISOString() } : null; }
  async health() { try { await this.pool.query('SELECT 1'); return true; } catch { return false; } }
}
