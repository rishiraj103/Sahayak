import OpenAI from 'openai';
import { z } from 'zod';
import type { Application, Explanation } from './domain/types.js';
import type { ApplicationDecision } from './domain/rules.js';

const explanationSchema = z.object({ headline: z.string().max(100), explanation: z.string().max(420), nextStep: z.string().max(220), actionMessage: z.string().max(220) });
export interface ExplanationService { generate(application: Application, decision: ApplicationDecision): Promise<Explanation | null> }

export class OpenAIExplanationService implements ExplanationService {
  constructor(private readonly client: OpenAI, private readonly model: string) {}
  async generate(application: Application, decision: ApplicationDecision): Promise<Explanation | null> {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await this.client.responses.create({ model: this.model, store: false, instructions: 'Write only citizen-friendly wording from the supplied synthetic facts. Do not invent dates, policy, eligibility, legal rights, fees, uploads, or government decisions. Return JSON matching the schema.', input: JSON.stringify({ service: application.serviceType, status: application.status, currentStage: application.currentStage, elapsedDays: decision.elapsedDays, expectedMaxDays: decision.currentStage.expectedMaxDays, delayed: decision.isDelayed, actionRequired: decision.actionRequired, action: application.action?.description ?? null, canEscalate: decision.canEscalate }), text: { format: { type: 'json_schema', name: 'citizen_explanation', strict: true, schema: { type: 'object', additionalProperties: false, properties: { headline: { type: 'string' }, explanation: { type: 'string' }, nextStep: { type: 'string' }, actionMessage: { type: 'string' } }, required: ['headline', 'explanation', 'nextStep', 'actionMessage'] } } } }, { signal: controller.signal });
      return explanationSchema.parse(JSON.parse(response.output_text));
    } catch { return null; } finally { clearTimeout(timeout); }
  }
}

export class DisabledExplanationService implements ExplanationService { async generate() { return null; } }
