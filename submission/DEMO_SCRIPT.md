# Two-minute demo script

## 0:00–1:00 — Citizen journey

Open Sahayak and select the sample `INC-2026-01842` with submission date `16 Aug 2026`.

“A citizen has already submitted an Income Certificate application. A normal portal status such as ‘Under Verification’ still leaves them wondering: do I need to act, what happens next, and when should I escalate?”

Show the action-first dashboard. Point out the translated headline, current stage, waiting time, expected duration, and clear answer: no document is needed right now.

Open the timeline. Explain that completed, current, and upcoming stages are visible without relying on colour alone.

Show the grievance section. Explain that it appears because deterministic backend rules identify a delayed, non-terminal application with no pending citizen action. Submit it and show the generated grievance number and `Submitted` status.

## 1:00–2:00 — How it works

“All data is synthetic. This prototype never contacts or impersonates a government system.”

Show the architecture: React citizen interface → Fastify API → PostgreSQL persistence → deterministic rules → OpenAI explanation cache.

Explain that application facts, delay calculation, action requirements, escalation eligibility, and grievance creation stay in the backend. OpenAI only turns those supplied facts into plain-language wording. Seeded explanations keep the primary journey working when the API key is unavailable, slow, or rate-limited.

Close with the future path: authorised government data integration would feed the same normalisation, rules, explanation, and citizen-experience layers.
