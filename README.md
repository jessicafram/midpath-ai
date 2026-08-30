# MidPath AI

> **Evidence-driven engineering readiness assessment for the work that passing tests do not prove.**

MidPath AI is an agentic evaluation system designed to assess software engineering competency from **concrete engineering evidence**, rather than self-reported skills, isolated coding exercises, or test outcomes alone.

A passing test demonstrates that a specific scenario worked under the conditions that were exercised.

It does **not** automatically prove that the implementation provides the engineering guarantees expected in production — such as concurrency safety, transactional consistency, authorization boundaries, failure recovery, or reliable idempotency.

MidPath AI is designed to reason about that gap.

---

## The Problem

Software engineering competency is difficult to evaluate reliably.

Traditional assessment approaches often rely on signals such as:

- self-reported experience;
- technology checklists;
- isolated coding exercises;
- automated test results;
- or a final implementation without explicit evidence of the reasoning and guarantees behind it.

These signals are useful, but incomplete.

A developer may produce code that passes every available test while the implementation still contains an important engineering weakness that the test suite never exercised.

For example:

- sequential requests may pass while concurrent requests violate idempotency;
- multiple persistence operations may succeed on the happy path while partial failures leave inconsistent state;
- an authenticated request may successfully update a resource while ownership authorization is never enforced.

In each case, the visible behavior can appear correct while an important production guarantee remains unsupported.

This creates a fundamental distinction:

> **Passing tests are evidence of tested behavior. They are not, by themselves, proof of an engineering guarantee.**

MidPath AI makes that distinction explicit.

---

## What MidPath AI Does

MidPath AI analyzes engineering artifacts and builds a structured chain from **observable evidence** to **engineering judgment**.

Instead of asking only:

> *“Does this developer know idempotency?”*

MidPath asks:

> *“What evidence in the engineering artifacts supports that conclusion, what guarantee does that evidence establish, and what remains unproven?”*

The system decomposes the evaluation into specialized stages that:

1. inspect engineering artifacts;
2. extract concrete evidence;
3. map that evidence to engineering competencies;
4. identify important reliability or correctness gaps;
5. verify whether the resulting conclusions are supported by the extracted evidence.

The output is therefore not intended to be just another AI-generated score.

It is intended to be a **traceable engineering judgment**.

---

## Core Principle: Evidence Before Judgment

MidPath follows one central rule:

> **No engineering conclusion without evidence.**

The evaluation chain is:

**Engineering Artifact → Evidence → Competency Assessment → Critical Finding → Verification**

Each stage has a distinct responsibility.

Engineering artifacts provide the observable source material.

Evidence records what can actually be supported by those artifacts.

Competency assessments infer engineering capability from that evidence.

Critical findings identify gaps between observed behavior and stronger engineering guarantees.

Verification checks whether the conclusions remain connected to concrete evidence rather than unsupported model reasoning.

This creates a separation between three questions that are often incorrectly collapsed into one:

1. **What did the implementation demonstrably do?**
2. **What engineering guarantees are actually supported by that evidence?**
3. **What competency level can reasonably be inferred from those guarantees?**

That separation is the foundation of MidPath AI.

---

## System Architecture

MidPath AI is structured as a multi-stage agentic evaluation pipeline.

The architecture deliberately separates **observation**, **inference**, and **verification** rather than asking a single model invocation to inspect the artifacts and produce an unstructured final judgment.

```mermaid
flowchart LR
    A["Engineering Artifacts"] --> B["Evidence Analyst"]
    B --> C["Evidence Store"]
    C --> D["Competency Mapper"]
    D --> E["Competency Assessments"]
    C --> F["Verification Agent"]
    E --> F
    F --> G["Verified Evaluation"]

    H["Evaluation Rubric"] --> D
    H --> F

       B -. "Evidence IDs" .-> D
    D -. "Evidence References" .-> F
```
### Why an Agentic Workflow?

A single LLM call could read the artifacts, assign competency levels, and produce a final explanation.

That would be simpler.

It would also collapse several fundamentally different reasoning tasks into one opaque operation.

MidPath instead decomposes the evaluation because each stage answers a different question:

| Stage | Primary Question | Responsibility |
|---|---|---|
| **Evidence Analyst** | What can actually be observed in the artifacts? | Extract concrete, referenceable engineering evidence without assigning competency levels. |
| **Competency Mapper** | What competency level is supported by that evidence? | Evaluate the extracted evidence against an explicit competency rubric. |
| **Verification Agent** | Are the conclusions actually justified by the available evidence? | Inspect assessments and evidence references, surface critical gaps, and preserve traceability. |

This separation creates explicit intermediate state between reasoning stages.

Rather than allowing one model response to simultaneously decide **what happened**, **what it means**, and **whether its own conclusion is justified**, MidPath makes those decisions independently inspectable.

The agentic decomposition provides four architectural properties:

1. **Separation of concerns** — evidence extraction, competency inference, and verification have different responsibilities.
2. **Traceability** — downstream conclusions can reference stable Evidence IDs rather than relying only on natural-language rationale.
3. **Inspectability** — intermediate outputs can be examined independently when an evaluation is unexpected or incorrect.
4. **Extensibility** — individual stages can evolve, be replaced, or be evaluated independently without redesigning the entire workflow.

The purpose of the multi-stage architecture is therefore not to maximize the number of agents.

It is to introduce **reasoning boundaries where engineering judgment benefits from explicit evidence and independent verification**.

### Agent 1 — Evidence Analyst

The **Evidence Analyst** is the observation boundary of the MidPath workflow.

Its responsibility is deliberately narrow:

> **Extract what the submitted engineering artifacts actually support — and nothing more.**

It receives the engineering task together with the submitted artifacts and converts them into atomic evidence records.

#### Input

```ts
{
  caseId: string;
  task: string;
  artifacts: Array<{
    path: string;
    content: string;
  }>;
}
```

The artifacts are treated as the source of truth for the analysis.

The agent is explicitly instructed not to assume infrastructure, database constraints, transaction semantics, deployment configuration, or runtime guarantees that are not visible in those artifacts.

#### Output

The Evidence Analyst produces a structured `EvidenceAnalysis`:

```ts
{
  caseId: string;
  evidence: Array<{
    id: string;
    artifact: string;
    observation: string;
    evidenceType:
      | "implementation"
      | "test"
      | "contract"
      | "missing";
    confidence: number;
  }>;
}
```

Each evidence item is intended to represent one focused engineering observation.

Evidence can describe:

- implementation behavior;
- test coverage;
- explicit contracts;
- or an important guarantee that is not demonstrated by the available artifacts.

The `artifact` field preserves provenance, while the Evidence ID provides a stable reference that downstream stages can use when producing competency assessments and verification findings.

#### Reasoning Boundary

The Evidence Analyst is explicitly prohibited from:

- assigning competency scores;
- classifying proficiency;
- recommending learning resources;
- inferring guarantees that are not demonstrated;
- treating passing tests as proof of behavior that the tests never exercised.

This boundary is important.

The Evidence Analyst answers:

> **“What can we support from the artifacts?”**

It does **not** answer:

> **“What competency level does this imply?”**

That decision belongs to the next stage.

#### Runtime Validation

MidPath does not accept the model response blindly.

The Evidence Analyst response is parsed and validated before it can enter the next stage of the workflow.

The implementation rejects responses when:

- the output is not valid JSON;
- the returned `caseId` does not match the evaluated case;
- the `evidence` collection is missing;
- required evidence fields have invalid types;
- `confidence` is outside the range `0..1`;
- or an unsupported evidence type is returned.

This creates a structured boundary between probabilistic model inference and deterministic application logic.

The result is a typed, validated evidence representation that downstream agents can inspect and reference.

### Agent 2 — Competency Mapper

The **Competency Mapper** is the inference boundary of the MidPath workflow.

Its responsibility is to determine what competency level is supported by the evidence produced in the previous stage.

A critical architectural constraint is that the Competency Mapper **does not receive the original engineering artifacts**.

It receives only:

1. the explicit competency rubric; and
2. the validated `EvidenceAnalysis`.

This prevents the mapping stage from independently reinterpreting the source artifacts and bypassing the evidence representation established by the Evidence Analyst.

#### Input

```ts
{
  caseId: string;
  rubric: string;
  evidenceAnalysis: EvidenceAnalysis;
}
```

The rubric defines the competencies that must be evaluated.

The evidence analysis defines the observations that the mapper is allowed to use.

The mapper is explicitly instructed to use only supplied evidence, avoid inventing implementation details or guarantees, and avoid creating competencies that are not present in the rubric.

#### Output

The Competency Mapper produces a structured `CompetencyMapping`:

```ts
{
  caseId: string;
  assessments: Array<{
    competency: string;
    level: number;
    evidenceIds: string[];
    missingEvidence: string[];
    justification: string;
  }>;
}
```

A competency assessment therefore contains more than a level.

It records:

- the competency being evaluated;
- the assigned level;
- the Evidence IDs supporting that assessment;
- evidence that would be required to justify a stronger conclusion;
- and a grounded justification.

This makes the assessment inspectable rather than reducing the evaluation to an isolated numeric score.

#### Reasoning Boundary

The Competency Mapper answers:

> **“What competency level is supported by the available evidence?”**

It does not answer:

> **“What else might be true about the implementation?”**

The agent is explicitly instructed not to invent tests, infrastructure, runtime behavior, implementation details, or engineering guarantees that are absent from the supplied evidence.

It must also distinguish ordinary successful behavior from stronger reliability guarantees.

For example, evidence that a sequential request succeeds cannot automatically establish concurrency safety, just as a successful happy path cannot automatically establish transactional recovery behavior.

When the available evidence is insufficient to justify a stronger level, the mapper records the relevant gap in `missingEvidence`.

#### Evidence Referential Integrity

Evidence references produced by the model are validated against the actual Evidence IDs created by the upstream Evidence Analyst.

For each assessment:

```text
Competency Assessment
        ↓
evidenceIds[]
        ↓
Validated against
        ↓
EvidenceAnalysis.evidence[].id
```

An assessment cannot successfully reference an Evidence ID that does not exist in the current evidence analysis.

This creates a deterministic referential boundary around an otherwise probabilistic inference step.

#### Rubric Conformance

The application also validates the structure of the competency mapping.

The implementation requires:

- every competency defined by the rubric to be assessed exactly once;
- no additional competencies;
- no duplicate competency assessments;
- integer competency levels within the supported `0..3` range;
- structured `evidenceIds` and `missingEvidence` collections;
- and a textual justification for each assessment.

The rubric itself is parsed before the mapping can be accepted, and malformed rubric input is rejected.

Together, these checks prevent structurally invalid model output from silently entering the next stage of the evaluation pipeline.

#### Transient Failure Handling

The Competency Mapper also distinguishes between transient provider failures and exhausted quota.

Transient model errors such as `503 / UNAVAILABLE` are retried with bounded incremental delay.

Quota exhaustion is treated as non-retryable, preventing repeated requests when immediate retry cannot resolve the failure.

This behavior keeps infrastructure failure handling separate from engineering evaluation logic.

The resulting `CompetencyMapping` is therefore a structured inference layer between validated engineering evidence and downstream verification.

### Agent 3 — Verification Agent

The **Verification Agent** is the supportability and traceability boundary of the MidPath workflow.

It receives:

1. the competency rubric;
2. the validated `EvidenceAnalysis`;
3. the `CompetencyMapping` produced by the previous stage.

Like the Competency Mapper, it **does not receive the original engineering artifacts**.

Its task is not to independently restart the analysis.

Its task is to verify whether the existing competency conclusions remain justified by the available evidence.

#### Input

```ts
{
  caseId: string;
  rubric: string;
  evidenceAnalysis: EvidenceAnalysis;
  competencyMapping: CompetencyMapping;
}
```

This gives the Verification Agent access to both the evidence layer and the inference layer.

It can therefore inspect whether competency levels, justifications, and evidence references remain consistent with the evidence that actually exists.

#### Output

The Verification Agent produces a structured `VerificationResult`:

```ts
{
  caseId: string;

  assessments: Array<{
    competency: string;
    level: number;
    evidenceIds: string[];
    missingEvidence: string[];
    justification: string;
  }>;

  criticalFindings: Array<{
    severity:
      | "low"
      | "medium"
      | "high"
      | "critical";
    competency: string;
    summary: string;
    evidenceIds: string[];
  }>;

  verificationNotes: string[];
}
```

The output therefore contains three forms of verified information:

- competency assessments;
- critical engineering findings;
- verification notes describing important observations about the evaluation.

#### Reasoning Boundary

The Verification Agent answers:

> **“Are these conclusions actually supported by the evidence available in this evaluation?”**

It is explicitly instructed to challenge unsupported conclusions.

The verification rules allow it to:

- preserve a competency level when the supplied evidence supports it;
- reduce a level when the evidence does not justify the stronger conclusion;
- remove or correct unsupported claims;
- identify critical engineering findings when those findings are supported by the evidence;
- and record verification observations without inventing new artifacts or implementation details.

This makes verification a separate reasoning stage rather than a request for the model to merely agree with the previous assessment.

#### No Hidden Answer Access

The Verification Agent is explicitly instructed not to compare the evaluation against a hidden reference answer.

It receives the rubric, evidence analysis, and competency mapping — but not the benchmark gold standard.

This keeps the verification stage separate from benchmark scoring.

The gold standard is used later by the evaluation harness to measure the quality of the completed workflow, not by the agent to produce its answer.

#### Evidence Traceability

Both verified competency assessments and critical findings must use Evidence IDs produced by the Evidence Analyst.

For verified assessments:

```text
Verified Assessment
        ↓
evidenceIds[]
        ↓
Validated against
        ↓
EvidenceAnalysis.evidence[].id
```

For critical findings:

```text
Critical Finding
        ↓
evidenceIds[]
        ↓
Validated against
        ↓
EvidenceAnalysis.evidence[].id
```

Unknown Evidence IDs are rejected by deterministic application validation.

This creates an explicit evidence chain from the final verification output back to the structured observations produced at the beginning of the workflow.

#### Critical Findings

The Verification Agent can surface engineering risks using four supported severity levels:

```text
low
medium
high
critical
```

Every critical finding must:

- reference a competency defined in the rubric;
- contain a textual summary;
- use a supported severity level;
- and reference Evidence IDs that exist in the current evidence analysis.

This allows MidPath to distinguish between an ordinary competency assessment and an engineering weakness that deserves explicit attention.

A critical finding is therefore not simply a lower competency score.

It is a separate, evidence-linked statement about an important reliability, correctness, or engineering risk observed during verification.

#### Runtime Validation

MidPath validates the Verification Agent response before accepting it as the final workflow output.

The implementation requires:

- the expected `caseId`;
- every rubric competency to appear exactly once;
- no unknown or duplicate competencies;
- integer competency levels within the supported `0..3` range;
- valid assessment evidence references;
- valid critical finding evidence references;
- supported critical finding severity values;
- critical findings to reference known rubric competencies;
- structured `missingEvidence` collections;
- textual assessment justifications;
- and string-only verification notes.

Malformed rubric input or structurally invalid model output is rejected.

This prevents unsupported response structure from silently becoming part of the final evaluation.

#### Verification as a Distinct Stage

The complete reasoning path is therefore:

```text
Engineering Artifacts
        ↓
Evidence Analyst
        ↓
Validated Evidence
        ↓
Competency Mapper
        ↓
Evidence-Grounded Assessment
        ↓
Verification Agent
        ↓
Verified Assessments
+ Critical Findings
+ Verification Notes
```

The Verification Agent closes the MidPath reasoning loop by testing whether the inferred engineering judgment remains connected to the evidence from which it originated.

It does not guarantee that the model's reasoning is objectively correct.

It does make the reasoning **inspectable, constrained, and traceable**.

---

## Experimental Methodology

MidPath AI is evaluated using explicit benchmark cases with independently defined reference expectations.

The purpose of the benchmark is not merely to determine whether an evaluator produces plausible prose.

It is to measure whether the evaluator can recover engineering conclusions that are supported by the submitted artifacts, identify important engineering risks, and preserve a traceable evidence chain.

### Gold Standard

Each benchmark case contains a structured **gold standard** representing the expected engineering assessment for that case.

The gold standard is authored independently of the evaluator output and is not supplied to the Baseline evaluator or to any MidPath agent during inference.

It is used only after an evaluation has completed, when the evaluation harness compares the produced result against the reference expectations.

The experimental separation is therefore:

```text
Task + Artifacts + Rubric
          ↓
      Evaluator
          ↓
    Produced Result

-------------------------

    Gold Standard
          +
    Produced Result
          ↓
     Offline Scoring
```

This prevents the evaluation workflow from using the expected benchmark answer as evidence for its own conclusions.

#### Gold Standard Structure

A gold standard contains more than expected numeric levels.

For each competency, it records:

```ts
{
  competency: string;
  expected_level: number;
  label: string;
  supported_evidence: Array<{
    artifact: string;
    observation: string;
  }>;
  missing_evidence: string[];
  justification: string;
}
```

This allows the reference assessment to represent both sides of an engineering judgment:

- what the submitted artifacts actually demonstrate;
- and what evidence is still absent for a stronger conclusion.

The benchmark therefore does not treat competency assessment as a simple classification problem detached from engineering reasoning.

#### Critical Finding Reference

Each case can also define a reference critical finding containing:

```ts
{
  id: string;
  severity: string;
  competency: string;
  summary: string;
  evidence: Array<{
    artifact: string;
    observation: string;
  }>;
  failure_scenario: string[];
  expected_diagnostic_conclusion: string;
}
```

The critical finding represents the engineering weakness that the case is specifically designed to test.

It includes not only the expected category and severity, but also the artifact evidence and failure scenario that justify the conclusion.

#### Example — Idempotency Reliability

In the idempotency benchmark, the submitted implementation demonstrates successful **sequential duplicate handling**.

The gold standard intentionally does not treat that behavior as proof of concurrency-safe idempotency.

The reference assessment recognizes evidence that:

- an existing idempotency record is reused;
- a sequential duplicate request returns the original payment;
- and the common retry path is covered by tests.

But it also records missing evidence for:

- atomic idempotency claims;
- concurrency-safe duplicate protection;
- database-level uniqueness;
- and concurrent duplicate-request testing.

The critical reference finding is therefore:

> **The implementation demonstrates sequential idempotency behavior but does not provide sufficient evidence of concurrency-safe idempotency.**

The associated failure scenario makes the hidden reliability gap explicit:

```text
Request A checks the key → no record
Request B checks the same key → no record

Request A creates a payment
Request B creates another payment

Only afterward are idempotency records persisted
```

The benchmark therefore evaluates whether an assessment can distinguish **tested behavior** from the stronger engineering guarantee that the tests do not establish.

#### Predefined Before Evaluation

Gold standards are defined before evaluator execution and completed benchmark outputs are treated as frozen experimental results rather than repeatedly regenerated until a favorable answer appears.

This reduces post-hoc tuning pressure and keeps the benchmark reference independent from model output.

The gold standard is therefore an **evaluation instrument**, not an input to the agentic reasoning process.

## Benchmark Case Design

The benchmark cases are designed to test whether an evaluator can distinguish **observable successful behavior** from **stronger engineering guarantees that are not demonstrated by the submitted artifacts**.

Each case contains:

- an engineering task;
- implementation artifacts;
- test artifacts;
- an explicit competency rubric;
- a predefined gold standard;
- and one primary engineering weakness that the evaluator is expected to identify.

The cases are intentionally small enough to remain inspectable, but each contains a failure mode that requires engineering judgment beyond simply observing that the provided tests pass.

### Case 001 — Idempotency Reliability

**Primary risk:** concurrent duplicate payment processing.

The implementation correctly handles sequential requests using the same idempotency key.

The supplied tests verify this behavior.

However, the workflow performs the relevant operations separately:

```text
Check idempotency key
        ↓
Create payment
        ↓
Persist idempotency record
```

The submitted artifacts do not demonstrate an atomic boundary around these operations.

Two concurrent requests can therefore observe the same key as absent before either request persists the idempotency record.

The benchmark evaluates whether the evaluator distinguishes:

> “Sequential duplicate requests are handled correctly.”

from the stronger conclusion:

> “Duplicate payment processing is prevented under concurrency.”

The first conclusion is supported by the artifacts.

The second is not.

The gold-standard critical finding is therefore associated with **IDEMPOTENCY_RELIABILITY** and identifies the missing concurrency-safe idempotency guarantee.

### Case 002 — Transaction Consistency

**Primary risk:** partial writes across multiple persistence operations.

The implementation performs several state-changing operations during a single business workflow.

Conceptually:

```text
Create Order
     ↓
Decrease Inventory
     ↓
Create Payment Attempt
```

The supplied tests demonstrate the expected successful path and several input-validation behaviors.

However, the submitted artifacts do not demonstrate a transaction boundary, rollback mechanism, compensation strategy, or equivalent atomicity guarantee across these writes.

A failure after an earlier write can therefore leave the system in a partially updated state.

The benchmark evaluates whether the evaluator distinguishes:

> “The expected workflow succeeds under the tested conditions.”

from:

> “The workflow preserves consistency when one of its persistence operations fails.”

The second guarantee requires evidence that the submitted artifacts do not provide.

The gold-standard critical finding is therefore associated with **TRANSACTION_RELIABILITY** and identifies the partial-write consistency risk.

### Case 003 — Authorization Boundary

**Primary risk:** missing resource-level ownership validation.

The implementation receives both an authenticated user identifier and a profile identifier.

It validates that the user is authenticated, loads the requested profile, validates the update data, and performs the update.

However, the submitted artifacts do not demonstrate that the authenticated user is verified as the owner of the profile being modified.

Conceptually, the implementation establishes:

```text
Authenticated User
        ↓
Profile Exists
        ↓
Update Profile
```

but does not establish:

```text
Authenticated User
        ↓
Owns Requested Profile
        ↓
Update Profile
```

The supplied tests exercise expected update and validation behavior, but they do not exercise a cross-user ownership scenario.

The benchmark therefore evaluates whether the evaluator distinguishes **authentication** from **resource-level authorization**.

The gold-standard critical finding is associated with **AUTHORIZATION_RELIABILITY** and identifies the missing ownership check.

### Why Multiple Cases?

The three cases exercise different engineering failure classes:

| Case | Engineering Domain | Hidden Gap |
|---|---|---|
| **001** | Idempotency / Concurrency | Sequential correctness does not establish concurrency safety |
| **002** | Persistence / Transactions | Happy-path success does not establish atomic multi-write behavior |
| **003** | Authorization | Authentication does not establish resource ownership |

This diversity is intentional.

A workflow that succeeds only on the idempotency example could simply be responding to terminology or patterns specific to that case.

Using independent failure classes provides a stronger test of whether the evaluation workflow consistently applies the underlying principle:

> **Observed behavior should not be promoted into a stronger engineering guarantee without supporting evidence.**