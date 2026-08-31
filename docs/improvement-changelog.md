# MidPath AI — Improvement Changelog

This changelog documents the main engineering iterations completed during the Frontier Engineering Challenge 2026.

The goal was not to maximize benchmark scores through post-hoc prompt tuning. The goal was to evolve a simple baseline into an evidence-driven, traceable engineering assessment workflow while preserving experimental integrity.

---

## Iteration 0 — Project Initialization and First Gold Standard

### What changed

The project was initialized and the first benchmark case was defined around idempotency and concurrent payment creation.

The gold-standard assessment was authored before model execution.

### Why

A fixed reference was required before evaluating either the baseline or the agentic workflow.

### Evidence

Git history:

- `ed3cdb5` — initialize MidPath AI hackathon project
- `c095174` — add first gold-standard idempotency evaluation case

### Decision / Learning

Benchmark expectations must exist before model execution to reduce the risk of adapting evaluation criteria to observed outputs.

---

## Iteration 1 — Evidence Store Redesign

### What changed

The initial evidence-store representation was replaced with a redesigned evidence data model.

### Why

The final workflow required evidence to remain addressable across multiple stages:

artifact analysis -> evidence extraction -> competency mapping -> verification -> traceability scoring.

A simple intermediate representation was not sufficient for that workflow.

### Evidence

Git history:

- `87126f4` — redesign evidence store data model
- `4709559` — complete first evidence-driven benchmark case

### Decision / Learning

Evidence needed stable identifiers and explicit provenance so downstream assessments could reference the exact artifacts supporting a claim.

### Removed / Replaced Experiment

The original evidence-store representation was not retained.

It was replaced early in development by the redesigned evidence model because the workflow required source-linked evidence that could survive across agent boundaries and later be audited.

This became an important architectural lesson: traceability cannot be added reliably at the presentation layer; the underlying data model must preserve provenance from the beginning.

---

## Iteration 2 — Reproducible Zero-Shot Baseline

### What changed

A simple zero-shot evaluator was implemented as the comparison baseline.

### Why

The hackathon required the final agentic solution to be compared against a simpler approach performing the same task.

### Evidence

Git history:

- `12d1cd7` — add reproducible baseline evaluator

### Decision / Learning

The baseline and MidPath use the same Gemini model and benchmark cases so that workflow design, rather than model selection, is the primary architectural difference.

---

## Iteration 3 — Agentic MidPath Evaluator

### What changed

The single evaluation step was replaced by a structured workflow composed of:

1. Evidence Analyst
2. Competency Mapper
3. Verification Agent

### Why

A direct model response can produce a plausible assessment without preserving how each conclusion was derived.

The agentic workflow was designed to make evidence extraction and verification explicit.

### Evidence

Git history:

- `718f592` — add evidence-driven MidPath evaluator MVP
- `356bdc4` — document Evidence Analyst contract
- `1c9267c` — document Competency Mapper contract
- `2f4c68f` — document Verification Agent contract

### Decision / Learning

Specialization was useful only when each stage had a clear responsibility and passed structured evidence to the next stage.

The number of agents was not the goal; separation of responsibilities was.

---

## Iteration 4 — Automated Scoring

### What changed

Automated benchmark scoring was added.

### Why

Manual interpretation would make baseline-versus-MidPath comparisons difficult to reproduce.

### Evidence

Git history:

- `b0f43f9` — add automated evaluation scoring
- `bcaac61` — document evaluation and scoring methodology

### Decision / Learning

The scoring layer needed to remain separate from model execution so frozen outputs could be evaluated repeatedly without rerunning the model.

---

## Iteration 5 — Traceability Coverage

### What changed

Traceability coverage was added as an explicit measurement.

### Why

Score accuracy alone could not distinguish a plausible unsupported assessment from one whose findings resolve to concrete evidence.

### Evidence

Git history:

- `874b485` — add traceability coverage scoring
- `7aa3ce0` — aggregate critical findings and traceability metrics

### Result

In the completed paired benchmark cases, MidPath achieved 100% resolvable references for assessments and critical findings.

This metric represents referential traceability only. It does not prove that every referenced claim is semantically correct.

### Decision / Learning

Auditability must be measured separately from score accuracy.

---

## Iteration 6 — Transaction Consistency Benchmark

### What changed

A second benchmark case was introduced around transactional consistency and partial writes.

### Why

The first case focused on concurrency and idempotency. A second failure mode was needed to test whether the workflow generalized beyond one reliability pattern.

### Evidence

Git history:

- `402c76c` — add transaction consistency benchmark case
- `c723a55` — record transaction consistency benchmark results

### Result

Baseline and MidPath both achieved 80% exact-match accuracy on the case.

MidPath additionally preserved resolvable evidence references for its assessment and critical finding.

### Decision / Learning

The second case did not demonstrate an accuracy advantage for MidPath.

It did demonstrate that evidence-linked assessment could generalize to a different engineering failure mode.

---

## Iteration 7 — Runner Generalization and Failure Handling

### What changed

Evaluation runners were generalized and transient provider failures were handled explicitly.

Authorization-specific execution and quota-aware retry behavior were later added.

### Why

The evaluation harness needed to support multiple benchmark cases without embedding assumptions from the first case.

External model failures also needed to remain distinguishable from negative evaluation results.

### Evidence

Git history:

- `3b84330` — generalize evaluation runners and handle transient model failures
- `05417e4` — support authorization benchmark and quota-aware retries

### Decision / Learning

Infrastructure failure must not silently become model evidence.

An unavailable evaluation is different from a score of zero.

---

## Iteration 8 — Authorization Boundary Benchmark

### What changed

A third benchmark case was added around missing resource-level ownership checks.

### Evidence

Git history:

- `403d8ea` — add authorization boundary benchmark case
- `629d203` — record authorization boundary baseline result

### Result

The baseline completed.

The MidPath evaluation could not complete because the external Gemini free-tier quota was exhausted.

The result was preserved as unavailable rather than converted into a failed or zero-scored assessment.

### Decision / Learning

Unavailable evidence is not negative evidence.

Preserving the failed execution increased experimental integrity even though it reduced the number of completed paired cases.

---

## Iteration 9 — Benchmark Aggregation and Documentation

### What changed

Benchmark results, critical findings, and traceability metrics were aggregated, followed by explicit documentation of the system architecture, agents, methodology, baseline, gold standards, and scoring process.

### Evidence

Git history:

- `b0cc81f` — add benchmark results aggregation
- `7aa3ce0` — aggregate critical findings and traceability metrics
- `d2835d5` — add problem statement and system architecture
- `8559db3` — explain agentic workflow design
- `14f5a28` — document gold-standard methodology
- `3ec5f1b` — document benchmark case design
- `d7f66c6` — document baseline evaluation methodology
- `bcaac61` — document evaluation and scoring methodology

### Decision / Learning

A reproducible engineering assessment requires more than a final score. The assumptions, artifacts, evaluation cases, execution failures, and scoring rules must remain inspectable.

---

## Iteration 10 — Interactive Benchmark Demo

### What changed

A static interactive interface was added to present the implemented MidPath workflow and frozen benchmark results.

### Evidence

Git history:

- `d56e8a7` — add interactive MidPath benchmark demo

### Decision / Learning

The UI is a presentation layer over the implemented benchmark and agent workflow. It does not replace or simulate the underlying evaluation artifacts.

---

# Final Measured Outcome

Across the two completed paired benchmark cases:

| Case | Baseline Exact Match | MidPath Exact Match | MidPath Traceability |
| --- | ---: | ---: | ---: |
| Case 001 — Idempotency | 60% | 60% | 100% |
| Case 002 — Transaction Consistency | 80% | 80% | 100% |
| Case 003 — Authorization | Baseline completed | MidPath unavailable | N/A |

MidPath did not demonstrate higher score accuracy than the zero-shot baseline in the completed paired cases.

Its demonstrated architectural advantage was auditability: assessment and critical-finding references in the completed MidPath runs resolve to extracted evidence.

---

# Main Failure Mode

MidPath currently depends on an external LLM provider during evaluation.

Case 003 demonstrated that provider quota exhaustion can interrupt the multi-stage workflow before a final assessment is produced.

A production system would require stronger provider-failure isolation, persisted intermediate state, and resumable execution.

---

# Hot Take

Passing tests are evidence about tested behavior, not proof of an engineering guarantee.

For engineering readiness assessment, a plausible score is insufficient.

A useful assessment should be a claim whose supporting evidence can be inspected.