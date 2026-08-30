


MidPath AI
Evidence-driven engineering readiness assessment for the work that
passing tests do not prove.

MidPath AI is an agentic evaluation system that assesses software
engineering competency from concrete engineering evidence rather
than self-reported skills, isolated coding exercises, or test outcomes
alone.

A passing test proves that a tested scenario worked under the conditions
exercised. It does not automatically prove stronger production
guarantees such as concurrency safety, transactional consistency,
authorization boundaries, failure recovery, or reliable idempotency.

MidPath AI is designed to reason about that gap.

Why MidPath?
Software engineering assessment often collapses several different
questions into one:

Did the implementation pass its tests?

What behavior is actually demonstrated by the submitted artifacts?

What stronger engineering guarantees are supported?

What competency level can reasonably be inferred?

Can the final judgment be traced back to concrete evidence?

MidPath separates those questions.

Passing tests are evidence of tested behavior. They are not, by
themselves, proof of an engineering guarantee.

Example
A payment service may correctly handle two sequential requests using
the same idempotency key while still allowing duplicate payments under
concurrency.

Request A checks key → no record
Request B checks key → no record

Request A creates payment
Request B creates payment

Only afterward are idempotency records persisted
The visible tests may remain green.

The production guarantee may still be unsupported.

That distinction is the central problem MidPath evaluates.

What MidPath Does
MidPath builds a structured chain from observable engineering
artifacts to verified engineering judgment.

Engineering Artifact
        ↓
Evidence
        ↓
Competency Assessment
        ↓
Critical Finding
        ↓
Verification
Instead of asking only:

"Does this developer know idempotency?"

MidPath asks:

"What evidence supports that conclusion, what guarantee does that
evidence establish, and what remains unproven?"

The result is intended to be more than another AI-generated score.

It is a traceable engineering assessment.

Core Principle
No engineering conclusion without evidence.

MidPath deliberately separates:

observation --- what the artifacts demonstrate;

inference --- what competency level that evidence supports;

verification --- whether the conclusion remains supportable and
traceable.

This separation prevents ordinary successful behavior from being
silently promoted into stronger reliability claims.

System Architecture
flowchart LR
    A["Engineering Artifacts"] --> B["Evidence Analyst"]
    B --> C["Structured Evidence"]
    C --> D["Competency Mapper"]
    D --> E["Competency Assessments"]
    C --> F["Verification Agent"]
    E --> F
    F --> G["Verified Evaluation"]

    H["Evaluation Rubric"] --> D
    H --> F

    B -. "Evidence IDs" .-> D
    D -. "Evidence References" .-> F
Why an Agentic Workflow?
A single LLM call could inspect the artifacts, assign levels, and write
an explanation.

MidPath intentionally does not do that.

Stage Question Responsibility

Evidence Analyst What can actually be Extract atomic,
observed? referenceable evidence
without scoring
competency.

Competency Mapper What level is Map validated evidence
supported? to an explicit rubric.

The goal is not to maximize the number of agents. The goal is to create
reasoning boundaries where engineering judgment benefits from explicit
evidence and independent verification.

Agent 1 --- Evidence Analyst
The Evidence Analyst is the observation boundary.

It receives the engineering task and submitted artifacts and produces
structured evidence records.

interface EvidenceItem {
  id: string;
  artifact: string;
  observation: string;
  evidenceType:
    | "implementation"
    | "test"
    | "contract"
    | "missing";
  confidence: number;
}
It is explicitly instructed not to:

assign competency scores;

classify proficiency;

invent infrastructure or database guarantees;

assume transaction or deployment semantics;

treat passing tests as proof of behavior never exercised.

Its question is:

"What can we support from the artifacts?"

Deterministic Validation
Model output is not accepted blindly.

The application validates:

JSON structure;

expected caseId;

required evidence fields;

supported evidence types;

confidence in the 0..1 range.

This creates a deterministic boundary around probabilistic inference.

Agent 2 --- Competency Mapper
The Competency Mapper is the inference boundary.

A key constraint is that it does not receive the original engineering
artifacts.

It receives only:

the competency rubric;

the validated EvidenceAnalysis.

interface CompetencyAssessment {
  competency: string;
  level: number;
  evidenceIds: string[];
  missingEvidence: string[];
  justification: string;
}
This prevents the mapper from bypassing the evidence layer and
independently reinterpreting source artifacts.

For every competency it records:

assigned level;

supporting Evidence IDs;

missing evidence for stronger conclusions;

grounded justification.

Referential Integrity
Every referenced Evidence ID is checked against the Evidence Analyst
output.

Competency Assessment
        ↓
evidenceIds[]
        ↓
Validated against
        ↓
EvidenceAnalysis.evidence[].id
Unknown Evidence IDs are rejected.

The mapper must also assess every rubric competency exactly once,
introduce no unknown competencies, avoid duplicates, and return integer
levels within the supported 0..3 range.

Agent 3 --- Verification Agent
The Verification Agent is the supportability and traceability
boundary.

It receives:

the rubric;

validated evidence;

the competency mapping.

It does not receive the original artifacts or the benchmark gold
standard.

Its question is:

"Are these conclusions actually supported by the evidence available
in this evaluation?"

The agent can preserve, correct, or reduce unsupported competency
conclusions and can surface evidence-linked critical findings.

interface CriticalFinding {
  severity: "low" | "medium" | "high" | "critical";
  competency: string;
  summary: string;
  evidenceIds: string[];
}
Both assessments and critical findings must reference Evidence IDs that
exist in the current evidence analysis.

Verified Evaluation
        ↓
Evidence IDs
        ↓
Structured Evidence
        ↓
Submitted Artifacts
Verification does not guarantee objective correctness.

It makes the reasoning inspectable, constrained, and traceable.

Experimental Design
MidPath is evaluated with explicit benchmark cases and independently
defined reference expectations.

The benchmark asks whether an evaluator can:

recover competency conclusions supported by submitted artifacts;

identify important engineering risks;

distinguish tested behavior from stronger guarantees;

preserve a traceable evidence chain.

Gold Standard Isolation
Each benchmark case contains a predefined gold standard.

The gold standard is not supplied to the Baseline Evaluator,
Evidence Analyst, Competency Mapper, or Verification Agent.

Task + Artifacts + Rubric
          ↓
       Evaluator
          ↓
    Produced Result

-------------------------

Gold Standard + Produced Result
              ↓
        Offline Scoring
Gold standards contain expected competency levels, supporting evidence,
missing evidence, justification, and a reference critical finding.

They are defined before evaluator execution.

Completed benchmark outputs are treated as frozen experimental
observations rather than repeatedly regenerated until a favorable
answer appears.

This reduces post-hoc tuning pressure in a probabilistic evaluation
environment.

Benchmark Cases
The cases are intentionally compact enough to inspect while requiring
engineering judgment beyond observing that tests pass.

Case Engineering Domain Hidden Gap

001 --- Idempotency Concurrency / Sequential correctness
reliability does not establish
concurrency safety

002 --- Transaction Persistence / Happy-path success does
Consistency transactions not establish atomic
multi-write behavior

Case 001 --- Idempotency Reliability
Primary risk: concurrent duplicate payment processing.

The implementation handles sequential reuse of an idempotency key, and
the supplied tests verify that behavior.

The artifacts do not demonstrate an atomic boundary around:

Check idempotency key
        ↓
Create payment
        ↓
Persist idempotency record
The benchmark tests whether the evaluator distinguishes:

"Sequential duplicate requests are handled correctly."

from:

"Duplicate payment processing is prevented under concurrency."

The gold-standard critical competency is IDEMPOTENCY_RELIABILITY.

Case 002 --- Transaction Consistency
Primary risk: partial writes across multiple persistence operations.

Create Order
     ↓
Decrease Inventory
     ↓
Create Payment Attempt
The tests cover expected behavior and input validation, but the
artifacts do not demonstrate a transaction boundary, rollback mechanism,
compensation strategy, or equivalent atomicity guarantee.

The gold-standard critical competency is TRANSACTION_RELIABILITY.

Case 003 --- Authorization Boundary
Primary risk: missing resource-level ownership validation.

The implementation validates authentication and resource existence, but
does not demonstrate that the authenticated user owns the profile being
modified.

Authenticated User
        ↓
Profile Exists
        ↓
Update Profile
The missing guarantee is:

Authenticated User
        ↓
Owns Requested Profile
        ↓
Update Profile
The gold-standard critical competency is AUTHORIZATION_RELIABILITY.

Why Multiple Failure Classes?
The benchmark deliberately moves across concurrency, transaction
consistency, and authorization.

A workflow that succeeds only on one idempotency example could simply be
responding to terminology specific to that case.

The broader principle is:

Observed behavior should not be promoted into a stronger engineering
guarantee without supporting evidence.

Baseline Evaluator
The benchmark includes a deliberately simple non-agentic baseline.

The baseline receives the same task, rubric, implementation artifact,
and test artifact, then performs a direct model evaluation in a single
inference step.

Task + Rubric + Artifacts
          ↓
Single Model Evaluation
          ↓
Competency Assessments
+ Critical Findings
Baseline vs. MidPath
Baseline MidPath

Single inference step Multi-stage agentic workflow

Direct artifact access Explicit evidence representation

Natural-language artifact evidence Stable Evidence ID chain

Assessment produced directly Assessment independently verified

The experiment does not assume that a multi-agent workflow must
produce higher classification accuracy.

It asks:

What does an explicit evidence-driven and independently verified
workflow add to direct model evaluation?

This distinction matters because a capable model may already identify
engineering risks directly from source code.

Evaluation & Scoring
Scoring happens offline after an evaluation result has been recorded.

The benchmark measures four dimensions:

Competency Exact Match

Mean Absolute Error (MAE)

Critical Finding Detection

Evidence Traceability Coverage

Competency Exact Match
Exact Match Rate
=
Exact Competency Matches
────────────────────────
Total Compared Competencies
Higher is better.

Mean Absolute Error
MAE
=
Σ | predictedLevel - expectedLevel |
───────────────────────────────────
      Number of Competencies
Lower is better.

Exact Match is strict classification agreement. MAE additionally shows
how far incorrect predictions are from the reference.

Critical Finding Detection
The scorer asks two separate questions:

Did the evaluator produce a critical finding for the expected
competency?

If so, did the severity match the gold standard?

{
  detected: boolean;
  severityMatched: boolean;
}
This preserves the distinction between recognizing the correct risk
domain and estimating its severity correctly.

Evidence Traceability Coverage
For MidPath, downstream conclusions are checked against the valid
Evidence IDs produced by the Evidence Analyst.

Traceability Coverage
=
Traceable Items
───────────────
Total Items
A downstream item is traceable when it contains at least one Evidence ID
that resolves to the evidence analysis for that execution.

Traceability is measured separately for:

competency assessments;

critical findings.

Traceability Is Not Accuracy
A conclusion can be traceable and still be incorrect.

A direct evaluator can also reach a correct conclusion without producing
MidPath's Evidence ID chain.

Therefore:

Accuracy
    ≠
Traceability
Traceability is reported as an architectural auditability property of
MidPath, not as an apples-to-apples accuracy advantage over the
Baseline.

Benchmark Results
The current frozen benchmark results are:

Case Evaluator Exact Match MAE Critical Severity Traceability
Risk Match
Detected

001 --- Baseline 60% 0.40 Yes Yes ---
Idempotency

              MidPath                   60%         0.40 Yes        Yes        100%
                                                                               assessments /
                                                                               100% findings
002 --- Baseline 80% 0.20 Yes Yes ---
Transaction
Consistency

              MidPath                   80%         0.20 Yes        Yes        100%
                                                                               assessments /
                                                                               100% findings
003 --- Baseline 40% 0.60 Yes No ---
Authorization
Boundary

              MidPath       **Unavailable**          --- ---        ---        ---
What the Results Show
The completed paired runs do not show a competency-classification
accuracy advantage for MidPath.

That result is important.

In Cases 001 and 002, Baseline and MidPath produced the same Exact Match
Rate and MAE.

Both also detected the expected critical engineering-risk domain and
matched its severity.

MidPath's measurable distinction in those completed runs is
traceability:

Case 001
Assessment Traceability      5 / 5 = 100%
Critical Finding Traceability 3 / 3 = 100%

Case 002
Assessment Traceability      5 / 5 = 100%
Critical Finding Traceability 2 / 2 = 100%
This supports a narrower and more defensible conclusion:

MidPath did not outperform the direct baseline on competency-score
accuracy in the completed paired cases, but it produced a fully
resolvable structured evidence chain for its downstream assessments
and critical findings.

That is an architectural result, not a claim of general model
superiority.

Case 003 Status
The Baseline completed Case 003 with:

Exact Match Rate = 40%
MAE              = 0.60
Critical domain  = detected
Severity         = mismatched
The corresponding MidPath run was not completed because the external
model provider's free-tier request quota was exhausted during the
multi-stage workflow.

The missing result is represented as unavailable, not converted into
a zero score and not replaced by repeated inference using a different
model.

This preserves comparability with the frozen runs.

Interpretation
The experiment suggests three useful observations.

1. A direct model can already identify important engineering risks
The Baseline detected the target critical-risk competency in all three
recorded Baseline runs.

MidPath should therefore not be justified by claiming that direct LLM
evaluation is incapable of engineering reasoning.

2. Multi-stage reasoning does not automatically improve classification accuracy
Cases 001 and 002 produced identical competency metrics for Baseline and
MidPath.

Adding agents is not, by itself, evidence of better evaluation.

3. Explicit evidence boundaries create inspectable provenance
MidPath's completed outputs retained valid Evidence ID references across
all scored competency assessments and critical findings.

This creates a property the direct baseline was not architected to
provide in the same form:

machine-checkable provenance across reasoning stages.

The benchmark therefore separates three dimensions:

Classification Quality
        +
Engineering-Risk Recognition
        +
Evidence Auditability
No single dimension is treated as proof of overall superiority.

Failure Handling & Experimental Integrity
MidPath distinguishes model-provider failures from
engineering-evaluation results.

Transient 503 / UNAVAILABLE failures can be retried with bounded
delay.

Quota exhaustion is treated as non-retryable.

This prevents infrastructure failures from being mistaken for assessment
conclusions and avoids repeatedly consuming requests when immediate
retry cannot resolve the problem.

The project also follows these experimental rules:

gold standards are defined before evaluation;

Baseline and MidPath use the same benchmark cases;

expected answers are not supplied during inference;

completed outputs are frozen;

results are not repeatedly regenerated to select favorable samples;

unavailable executions remain unavailable;

accuracy and traceability are reported separately.

Reproducibility
Requirements
Node.js 22+

npm

a Gemini API key

Install
npm install
Create a local .env file:

GEMINI_API_KEY=your_gemini_api_key_here
The real .env file is ignored by Git.

Run Tests
npm test
Run a Baseline Evaluation
Default case:

npm run baseline
For a specific benchmark case in PowerShell:

$env:CASE_ID="case-002-transaction-consistency"
npm run baseline
Run MidPath
Default case:

npm run midpath
For a specific case in PowerShell:

$env:CASE_ID="case-002-transaction-consistency"
npm run midpath
Score a Case
node --import tsx evaluation/scoring/run-scoring.ts
When selecting a specific case:

$env:CASE_ID="case-002-transaction-consistency"
node --import tsx evaluation/scoring/run-scoring.ts
Aggregate Available Results
node --import tsx evaluation/scoring/aggregate-results.ts
The aggregator discovers benchmark cases and reports whichever frozen
Baseline and MidPath results are currently available.

Repository Structure
midpath-ai/
├── docs/
├── evaluation/
│   ├── baseline/
│   │   ├── prompts/
│   │   └── run-baseline.ts
│   ├── cases/
│   │   ├── case-001-idempotency/
│   │   ├── case-002-transaction-consistency/
│   │   └── case-003-authorization-boundary/
│   ├── results/
│   │   ├── baseline/
│   │   └── midpath/
│   └── scoring/
│       ├── aggregate-results.ts
│       ├── run-scoring.ts
│       ├── score-result.test.ts
│       └── score-result.ts
├── src/
│   ├── agents/
│   │   ├── competency/
│   │   ├── evidence/
│   │   └── verification/
│   ├── application/
│   │   └── evaluation/
│   └── infrastructure/
├── .env.example
├── package.json
└── README.md
Design Decisions
Why not let every agent read the source code?
Because that would weaken the evidence boundary.

After evidence extraction, downstream agents operate on the structured
evidence representation rather than independently reconstructing their
own interpretation of the artifacts.

Why validate model output in application code?
LLM output is probabilistic.

The workflow therefore uses deterministic validation for structural
contracts such as:

valid JSON;

known case IDs;

known competencies;

valid level ranges;

supported severities;

valid Evidence ID references.

Why preserve missing evidence?
Engineering competency is often defined as much by what cannot be
demonstrated as by what can.

missingEvidence makes that uncertainty explicit instead of allowing
absence of proof to become proof of a stronger guarantee.

Why keep a simple Baseline?
Without it, the project could not separate the value of the workflow
architecture from the capability of the underlying model.

Limitations
This prototype intentionally has a narrow experimental scope.

Small Benchmark
The current benchmark contains three handcrafted cases.

The results are useful for validating the architecture and evaluation
method, but they are not sufficient to establish broad statistical
superiority.

Probabilistic Inference
Model responses can vary between executions.

Frozen outputs reduce post-hoc selection, but a stronger future
experiment should include repeated runs with controlled sampling and
confidence intervals.

Traceability Measures Referential Coverage
Current traceability scoring verifies whether downstream conclusions
resolve to valid Evidence IDs.

It does not prove that every cited piece of evidence semantically
entails the conclusion.

A future version should evaluate both referential and semantic
traceability.

Baseline and MidPath Evidence Schemas Differ
The Baseline contains natural-language artifact evidence, while MidPath
uses an explicit intermediate Evidence ID architecture.

For that reason, current traceability coverage is not presented as a
direct Baseline-vs-MidPath accuracy metric.

External Provider Constraints
Agentic workflows require multiple model calls per evaluation and
therefore have greater exposure to provider quotas and transient
availability than a single-call baseline.

Case 003 demonstrated this operational trade-off directly.

Future Work
The current prototype establishes the evidence-first evaluation loop.

Natural extensions include:

larger and independently authored benchmark suites;

repeated-run statistical evaluation;

semantic evidence-entailment scoring;

confidence calibration;

richer engineering artifacts such as pull requests, CI logs,
schemas, and architecture decisions;

remediation recommendations grounded in missing evidence;

reassessment after targeted engineering interventions;

persistent evidence storage and longitudinal competency tracking;

model/provider comparison under the same frozen benchmark.

The long-term direction is a closed loop:

Assessment
    ↓
Diagnosis
    ↓
Targeted Intervention
    ↓
Verification
    ↓
Evidence Delta
    ↓
Updated Assessment
Technical Stack
TypeScript

Node.js

Vitest

Google GenAI SDK

Gemini

structured JSON model outputs

deterministic runtime validation

evidence-linked multi-agent orchestration

Project Thesis
MidPath is based on a simple engineering principle:

Successful execution is not the same thing as demonstrated
reliability.

A test can show that a scenario passed.

An artifact can show that an implementation exists.

An LLM can produce a plausible assessment.

But an engineering-readiness system should be able to answer a harder
question:

What conclusion is actually justified by the available evidence?

MidPath makes that question explicit, preserves the evidence chain
through the evaluation workflow, and measures the result against a
predefined benchmark rather than treating plausible AI output as
sufficient.

Current Prototype Status
Evidence Analyst: implemented

Competency Mapper: implemented

Verification Agent: implemented

deterministic output validation: implemented

non-agentic Baseline: implemented

Gold Standard benchmark methodology: implemented

three benchmark cases: implemented

automated competency scoring: implemented

critical-finding scoring: implemented

traceability scoring: implemented

cross-case result aggregation: implemented

Case 001 paired evaluation: complete

Case 002 paired evaluation: complete

Case 003 Baseline evaluation: complete

Case 003 MidPath evaluation: unavailable due to provider quota
during the recorded experiment

Passing tests tell us what happened in the tested scenario. MidPath
tells us what engineering conclusions the available evidence can
actually support.