import 'dotenv/config';
import { buildApp } from './app.js';
import { MemoryRepository, PostgresRepository } from './repository.js';
import { DisabledExplanationService, OpenAIExplanationService } from './explanations.js';
import OpenAI from 'openai';

const service = process.env.OPENAI_API_KEY ? new OpenAIExplanationService(new OpenAI({ apiKey: process.env.OPENAI_API_KEY }), process.env.OPENAI_MODEL ?? 'gpt-5') : new DisabledExplanationService();
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) throw new Error('DATABASE_URL is required in production');
const repository = process.env.DATABASE_URL ? new PostgresRepository(process.env.DATABASE_URL) : new MemoryRepository();
const app = buildApp(repository, service, process.env.CORS_ORIGIN ?? 'http://localhost:5173');
await app.listen({ port: Number(process.env.PORT ?? 3001), host: '0.0.0.0' });
