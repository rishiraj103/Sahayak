# Submission summary

Sahayak helps citizens understand what happens after they submit a government-service application. Status portals may show a state such as “Under Verification,” but that alone does not answer the citizen’s real questions: What does this mean? Do I need to act? Is it delayed? What happens next? Can I escalate?

Our working prototype focuses on a synthetic Income Certificate workflow. A citizen enters a sample application number and submission date, then receives an action-first explanation, a visual timeline, a deterministic delay assessment, and either a clear required action or reassurance that nothing is needed. When deterministic rules confirm that a case is delayed and eligible, the citizen can file a synthetic grievance and receive a persistent grievance number.

The build is deliberately reliable: React provides a mobile-first experience; a Fastify API and PostgreSQL store application and grievance data; backend rules own all consequential decisions; and OpenAI converts supplied structured facts into plain-language wording. Four seeded explanations ensure the demo remains usable even if a live model call fails. All records are synthetic, no live government systems are accessed, and Sahayak is clearly presented as a prototype rather than an official service.
