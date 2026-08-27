import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { z } from 'zod';
import { evaluateApplication, RULE_VERSION } from './domain/rules.js';
import type { Repository } from './repository.js';
import type { ExplanationService } from './explanations.js';

const applicationNumber = z.string().regex(/^INC-2026-\d{5}$/);
const submissionDate = z.string().regex(/^2026-\d{2}-\d{2}$/);
export function buildApp(repository: Repository, explanationService: ExplanationService, corsOrigin = 'http://localhost:5173') {
  const app = Fastify({ logger: true });
  const normalizedCorsOrigin = corsOrigin.replace(/\/+$/, '');
  void app.register(cors, { origin: normalizedCorsOrigin }); void app.register(rateLimit, { max: 60, timeWindow: '1 minute' });
  app.setErrorHandler((error, request, reply) => { request.log.error(error); const candidate = error as { statusCode?: number }; const statusCode = typeof candidate.statusCode === 'number' && candidate.statusCode >= 400 && candidate.statusCode < 500 ? candidate.statusCode : 503; void reply.code(statusCode).send({ code: statusCode === 503 ? 'SERVICE_UNAVAILABLE' : 'INVALID_REQUEST' }); });
  async function load(params: unknown, query: unknown) {
    const number = applicationNumber.parse(z.object({ applicationNumber }).parse(params).applicationNumber);
    const date = submissionDate.parse(z.object({ submissionDate }).parse(query).submissionDate);
    const application = await repository.getApplication(number, date); if (!application) return null;
    return { application, decision: evaluateApplication(application) };
  }
  app.get('/healthz', async (_request, reply) => (await repository.health()) ? { status: 'ok' } : reply.code(503).send({ code: 'SERVICE_UNAVAILABLE' }));
  app.get('/api/v1/applications/:applicationNumber', async (request, reply) => {
    try { const result = await load(request.params, request.query); if (!result) return reply.code(404).send({ code: 'APPLICATION_NOT_FOUND' }); const cached = await repository.getExplanation(result.application.id, RULE_VERSION); return { application: result.application, decision: result.decision, explanation: cached ?? result.application.fallbackExplanation, explanationSource: cached ? 'cached' : 'seeded' }; }
    catch (error) { if (error instanceof z.ZodError) return reply.code(400).send({ code: 'INVALID_LOOKUP' }); throw error; }
  });
  app.post('/api/v1/applications/:applicationNumber/explanation', async (request, reply) => {
    try { const result = await load(request.params, request.query); if (!result) return reply.code(404).send({ code: 'APPLICATION_NOT_FOUND' }); const cached = await repository.getExplanation(result.application.id, RULE_VERSION); if (cached) return { explanation: cached, source: 'cached' }; const generated = await explanationService.generate(result.application, result.decision); if (generated) { await repository.saveExplanation(result.application.id, RULE_VERSION, generated, 'generated'); return { explanation: generated, source: 'generated' }; } return { explanation: result.application.fallbackExplanation, source: 'seeded' }; }
    catch (error) { if (error instanceof z.ZodError) return reply.code(400).send({ code: 'INVALID_LOOKUP' }); throw error; }
  });
  app.post('/api/v1/applications/:applicationNumber/grievances', async (request, reply) => {
    try { const result = await load(request.params, request.query); if (!result) return reply.code(404).send({ code: 'APPLICATION_NOT_FOUND' }); if (!result.decision.canEscalate) return reply.code(409).send({ code: 'ESCALATION_NOT_AVAILABLE' }); return reply.code(201).send(await repository.createGrievance(result.application)); }
    catch (error) { if (error instanceof z.ZodError) return reply.code(400).send({ code: 'INVALID_LOOKUP' }); throw error; }
  });
  app.get('/api/v1/grievances/:grievanceNumber', async (request, reply) => { const number = z.object({ grievanceNumber: z.string().regex(/^GRV-\d{4}-\d{6}$/) }).safeParse(request.params); if (!number.success) return reply.code(400).send({ code: 'INVALID_GRIEVANCE_NUMBER' }); const grievance = await repository.getGrievance(number.data.grievanceNumber); return grievance ? grievance : reply.code(404).send({ code: 'GRIEVANCE_NOT_FOUND' }); });
  return app;
}
