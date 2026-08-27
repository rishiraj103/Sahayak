CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY,
  application_number TEXT NOT NULL UNIQUE,
  submission_date DATE NOT NULL,
  service_type TEXT NOT NULL,
  status TEXT NOT NULL,
  current_stage TEXT NOT NULL,
  last_updated_at TIMESTAMPTZ NOT NULL,
  fallback_explanation JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS application_stages (
  id UUID PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  position INTEGER NOT NULL,
  state TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expected_max_days INTEGER NOT NULL,
  UNIQUE(application_id, position)
);

CREATE TABLE IF NOT EXISTS citizen_actions (
  id UUID PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  required BOOLEAN NOT NULL,
  description TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE SEQUENCE IF NOT EXISTS grievance_number_seq START 1001;
CREATE TABLE IF NOT EXISTS grievances (
  id UUID PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id),
  grievance_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS explanation_cache (
  id UUID PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  locale TEXT NOT NULL DEFAULT 'en',
  rule_version TEXT NOT NULL,
  explanation JSONB NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(application_id, locale, rule_version)
);
