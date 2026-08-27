import type { Application, Stage } from './types.js';

export const RULE_VERSION = '2026-08-01';
export interface ApplicationDecision { elapsedDays: number; isDelayed: boolean; actionRequired: boolean; canEscalate: boolean; escalationReason: string | null; currentStage: Stage }

export function evaluateApplication(application: Application, now = new Date()): ApplicationDecision {
  const currentStage = application.stages.find((stage) => stage.state === 'CURRENT');
  if (!currentStage) throw new Error('Application has no current stage');
  const elapsedDays = currentStage.startedAt ? Math.max(0, Math.floor((now.getTime() - Date.parse(currentStage.startedAt)) / 86_400_000)) : 0;
  const actionRequired = Boolean(application.action?.active && application.action.required);
  const terminal = application.currentStage === 'DELIVERED' || application.status === 'APPROVED';
  const isDelayed = !terminal && elapsedDays > currentStage.expectedMaxDays;
  const canEscalate = isDelayed && !actionRequired && !terminal;
  return { elapsedDays, isDelayed, actionRequired, canEscalate, escalationReason: canEscalate ? 'This application has exceeded the expected duration for its current stage.' : null, currentStage };
}
