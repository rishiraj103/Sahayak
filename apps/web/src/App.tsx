import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  api,
  type ApplicationData,
  type Explanation,
  type Grievance,
} from "./api";

const examples = [
  {
    number: "INC-2026-01842",
    date: "2026-08-16",
    label: "Delayed — grievance available",
  },
  { number: "INC-2026-01843", date: "2026-08-19", label: "Action required" },
  {
    number: "INC-2026-01844",
    date: "2026-08-24",
    label: "Progressing normally",
  },
  { number: "INC-2026-01845", date: "2026-08-10", label: "Certificate ready" },
];
const stageLabel = (stage: string) =>
  stage
    .split("_")
    .map((word) => word[0] + word.slice(1).toLowerCase())
    .join(" ");
const errorMessage = (code: string) =>
  ({
    APPLICATION_NOT_FOUND:
      "We could not find a matching synthetic application. Check the number and submission date.",
    INVALID_LOOKUP:
      "Enter an application number and submission date in the shown format.",
    ESCALATION_NOT_AVAILABLE:
      "A grievance is not available for this application right now.",
  })[code] ?? "The service is temporarily unavailable. Please try again.";

export default function App() {
  const [number, setNumber] = useState("");
  const [date, setDate] = useState("");
  const [data, setData] = useState<ApplicationData | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [grievance, setGrievance] = useState<Grievance | null>(null);
  const [error, setError] = useState("");
  const lookup = useMutation({
    mutationFn: () => api.lookup(number, date),
    onSuccess: (result) => {
      setData(result);
      setExplanation(result.explanation);
      setGrievance(null);
      setError("");
    },
    onError: (cause) => setError(errorMessage((cause as Error).message)),
  });
  const explain = useMutation({
    mutationFn: () => api.explain(number, date),
    onSuccess: (result) => setExplanation(result.explanation),
    onError: () => setError("The saved explanation is still available below."),
  });
  const submitGrievance = useMutation({
    mutationFn: () => api.createGrievance(number, date),
    onSuccess: (result) => {
      setGrievance(result);
      setError("");
    },
    onError: (cause) => setError(errorMessage((cause as Error).message)),
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    lookup.mutate();
  }
  function chooseExample(example: (typeof examples)[number]) {
    setNumber(example.number);
    setDate(example.date);
    setData(null);
    setGrievance(null);
    setError("");
  }
  const decision = data?.decision;
  return (
    <main className={data ? "results-page" : "landing-page"}>
      <header className="topbar">
        <a className="brand" href="#top">
          Sahayak
        </a>
        <span>Know what happens next</span>
      </header>
      <section className="hero" id="top">
        <p className="eyebrow">Income Certificate status translator</p>
        <h1>Understand your application, not just its status.</h1>
        <p className="hero-copy">
          Get a plain-language update, the next step, and a clear answer about
          whether you need to act.
        </p>
        <form onSubmit={submit} className="lookup" noValidate>
          <label>
            Application reference number
            <input
              aria-label="Application reference number"
              value={number}
              onChange={(event) => setNumber(event.target.value.toUpperCase())}
              placeholder="INC-2026-01842"
            />
          </label>
          <label>
            Submission date
            <input
              aria-label="Submission date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <button disabled={lookup.isPending}>
            {lookup.isPending ? "Checking…" : "Understand my application"}
          </button>
        </form>
        <div className="examples" aria-label="Demo applications">
          <span>Try a sample:</span>
          {examples.map((example) => (
            <button
              type="button"
              key={example.number}
              onClick={() => chooseExample(example)}
            >
              {example.label}
            </button>
          ))}
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
      {data && explanation && (
        <section className="dashboard" aria-live="polite">
          <div className="meta">
            <span>{data.application.serviceType}</span>
            <span>{data.application.applicationNumber}</span>
            <span>Submitted {data.application.submissionDate}</span>
          </div>
          <section
            className={`answer ${decision?.isDelayed ? "answer-warn" : decision?.actionRequired ? "answer-action" : "answer-good"}`}
          >
            <p className="eyebrow">Do I need to do anything?</p>
            <h2>{explanation.headline}</h2>
            <p>{explanation.actionMessage}</p>
            <div className="chips">
              <span>
                Current stage: {stageLabel(data.application.currentStage)}
              </span>
              {decision?.isDelayed && (
                <span>
                  Waiting {decision.elapsedDays} days; expected up to{" "}
                  {decision.currentStage.expectedMaxDays}
                </span>
              )}
            </div>
          </section>
          <section className="content-grid">
            <article>
              <h2>What this means</h2>
              <p>{explanation.explanation}</p>
              <button
                className="text-button"
                onClick={() => explain.mutate()}
                disabled={explain.isPending}
              >
                {explain.isPending
                  ? "Refreshing explanation…"
                  : "Refresh explanation"}
              </button>
            </article>
            <article>
              <h2>What happens next</h2>
              <p>{explanation.nextStep}</p>
              {data.application.action?.required && (
                <aside className="action-card">
                  <strong>Action required</strong>
                  <p>{data.application.action.description}</p>
                  <small>
                    This prototype does not collect or upload documents.
                  </small>
                </aside>
              )}
            </article>
          </section>
          <section className="timeline">
            <h2>Your application timeline</h2>
            <ol>
              {data.application.stages.map((stage) => (
                <li key={stage.stage} className={stage.state.toLowerCase()}>
                  <span aria-hidden="true">
                    {stage.state === "COMPLETED"
                      ? "✓"
                      : stage.state === "CURRENT"
                        ? "•"
                        : "○"}
                  </span>
                  <div>
                    <strong>{stageLabel(stage.stage)}</strong>
                    <small>
                      {stage.state === "CURRENT"
                        ? `In progress — expected up to ${stage.expectedMaxDays} days`
                        : stage.state === "COMPLETED"
                          ? "Completed"
                          : "Upcoming"}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          {decision?.canEscalate && !grievance && (
            <section className="grievance">
              <div>
                <p className="eyebrow">Escalation is available</p>
                <h2>You can raise a grievance</h2>
                <p>
                  {decision.escalationReason} We will submit a synthetic delay
                  summary only—no personal information.
                </p>
              </div>
              <button
                onClick={() => submitGrievance.mutate()}
                disabled={submitGrievance.isPending}
              >
                {submitGrievance.isPending
                  ? "Submitting…"
                  : "Raise a grievance"}
              </button>
            </section>
          )}
          {grievance && (
            <section className="confirmation" role="status">
              <p className="eyebrow">Grievance submitted</p>
              <h2>Your grievance number is {grievance.grievanceNumber}</h2>
              <p>
                Status: <strong>{grievance.status}</strong>. Expected response
                window: 3 working days in this synthetic prototype.
              </p>
              <p>{grievance.summary}</p>
            </section>
          )}
        </section>
      )}
      <footer>
        Prototype using synthetic application and grievance data. Not an
        official government service. No live government systems are accessed.
      </footer>
    </main>
  );
}
