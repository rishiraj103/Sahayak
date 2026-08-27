import { describe, expect, it } from 'vitest';
import { seededApplications } from './fixtures.js';
import { evaluateApplication } from './rules.js';

describe('application rules', () => {
  it('marks the delayed seed as escalation eligible', () => { const decision = evaluateApplication(seededApplications[0], new Date('2026-08-27T12:00:00Z')); expect(decision.isDelayed).toBe(true); expect(decision.canEscalate).toBe(true); });
  it('keeps an action-required application out of escalation', () => { const decision = evaluateApplication(seededApplications[1], new Date('2026-08-27T12:00:00Z')); expect(decision.actionRequired).toBe(true); expect(decision.canEscalate).toBe(false); });
  it('does not flag a stage at its expected maximum as delayed', () => { const application = structuredClone(seededApplications[2]); application.stages.find((stage) => stage.state === 'CURRENT')!.startedAt = '2026-08-24T00:00:00Z'; const decision = evaluateApplication(application, new Date('2026-08-27T00:00:00Z')); expect(decision.isDelayed).toBe(false); });
  it('never flags a terminal application as delayed', () => { const decision = evaluateApplication(seededApplications[3], new Date('2026-08-28T00:00:00Z')); expect(decision.isDelayed).toBe(false); expect(decision.canEscalate).toBe(false); });
});
