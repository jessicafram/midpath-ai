# MidPath AI — Evaluation Protocol

## 1. Evaluation Objective

The objective of this evaluation is to determine whether the MidPath AI evidence-gated agentic workflow improves engineering competency-gap diagnosis compared with a simple zero-shot LLM baseline.

The experiment measures both:

1. whether competency classifications are correct;
2. whether diagnostic claims are grounded in valid engineering evidence.

The evaluation does not assume that MidPath AI is superior.

The experiment is designed to test that hypothesis.

---

## 2. Research Question

> **Does an evidence-gated agentic workflow produce more accurate and better-grounded Backend Engineering competency diagnoses than a zero-shot general-purpose LLM?**

---

## 3. Evaluation Design

The evaluation uses three distinct concepts:

### 3.1 Gold Standard

The Gold Standard represents the expected competency classification for each evaluation case.

It is defined before running the baseline or MidPath AI.

The Gold Standard is not a competing solution.

It is the reference against which both systems are evaluated.

---

### 3.2 Baseline

The baseline is a general-purpose LLM operating with:

- one zero-shot prompt;
- the evaluation artifacts;
- the competency rubric.

The baseline does not have access to:

- historical competency data;
- an Evidence Store;
- agent orchestration;
- specialized verification tools;
- intervention history;
- persistent memory.

Conceptually:

```text
Engineering Artifacts
        ↓
Single Zero-Shot Prompt
        ↓
General-Purpose LLM
        ↓
Competency Diagnosis
```

---

### 3.3 MidPath AI

MidPath AI evaluates the same engineering artifacts through the evidence-gated workflow.

Conceptually:

```text
Engineering Artifacts
        ↓
Evidence Analysis
        ↓
Evidence Contract
        ↓
Evidence Gate
        ↓
Competency Engine
        ↓
Competency Diagnosis
```

Additional capabilities may be introduced during experiments only when they address an observed failure mode.

---

## 4. Gold Standard Dataset

The evaluation dataset contains at least **10 engineering cases**.

Each case includes:

- Task Description
- Engineering Artifacts
- Competencies Under Evaluation
- Expected Evidence
- Missing Evidence
- Competency Rubric
- Gold Standard Classification

The same cases are used for both the baseline and MidPath AI.

---

## 5. Competency Domain

The initial evaluation domain contains five Backend Engineering competencies:

1. REST API Design & Contracts
2. Data Persistence & Relational Modeling
3. Automated Testing
4. Error Handling
5. Idempotency & Reliability

Each competency is independently evaluated.

---

## 6. Competency Classification Scale

All Gold Standard, baseline, and MidPath classifications use the same discrete scale:

| Level | Classification | Description |
|---:|---|---|
| 0 | No Evidence | No artifact demonstrates the competency |
| 1 | Weak Evidence | Evidence exists but is incomplete or unreliable |
| 2 | Partial Evidence | Competency is demonstrated in common scenarios but important gaps remain |
| 3 | Strong Evidence | Artifacts demonstrate the competency reliably, including relevant edge cases |

This scale must be defined before running experiments.

---

## 7. Primary Metric — Diagnostic Accuracy (DA)

Diagnostic Accuracy measures how often the system assigns the same competency classification as the Gold Standard.

Formula:

```text
     Correct Competency Classifications
DA = ─────────────────────────────────── × 100
      Total Competency Classifications
```

Example:

```text
10 evaluation cases
×
5 competencies
=
50 competency classifications
```

If the system correctly classifies 42:

```text
DA = 42 / 50 × 100
DA = 84%
```

The primary comparison is:

```text
DA(MidPath) - DA(Baseline)
```

A positive difference indicates improved diagnostic accuracy.

---

## 8. Secondary Metric — Evidence Grounding Rate (EGR)

Evidence Grounding Rate measures whether diagnostic claims are supported by valid, traceable engineering evidence.

Formula:

```text
      Claims Supported by Valid Evidence
EGR = ─────────────────────────────────── × 100
             Total Diagnostic Claims
```

A claim is considered grounded only when its supporting evidence identifies:

- the artifact;
- the relevant location when applicable;
- the observed engineering behavior;
- the relationship between the observation and competency claim.

Example:

```text
Claim:
"Idempotency evidence is weak."

Valid evidence:
artifact: src/payment.ts
location: L42-L61
observation:
"No idempotency-key validation is performed."

Result:
Grounded claim = YES
```

Merely citing many files does not increase EGR.

Evidence must actually support the claim.

---

## 9. Exploratory Metric — Confidence-Evidence Gap (CEG)

When self-assessment data is available, MidPath may calculate the difference between learner confidence and observed competency evidence.

Conceptually:

```text
CEG = Self-Assessed Confidence - Evidence-Based Score
```

This metric is exploratory.

It is not used as the primary measure of MidPath effectiveness because the core experiment evaluates diagnostic quality against the Gold Standard.

---

## 10. Evidence Contract

Every MidPath competency diagnosis must follow the same structured contract:

```json
{
  "competency": "idempotency",
  "level": 1,
  "confidence": 0.91,
  "evidence": [
    {
      "artifact": "src/payment.ts",
      "location": "L42-L61",
      "observation": "No idempotency-key validation was detected."
    }
  ],
  "missing_evidence": [
    "duplicate-request test",
    "concurrent-request test"
  ],
  "reasoning_summary": "The successful request path exists, but the artifacts do not demonstrate duplicate-request safety."
}
```

This contract enables:

- traceability;
- deterministic validation;
- consistent evaluation;
- reproducible scoring.

---

## 11. Evidence Gate

Before a competency claim can influence the learner's profile, it must pass an Evidence Gate.

The Evidence Gate validates that:

1. the referenced artifact exists;
2. the evidence is structurally valid;
3. the observation is linked to a competency;
4. strong claims contain sufficient supporting evidence.

Conceptually:

```text
LLM Observation
      ↓
Evidence Contract
      ↓
Evidence Gate
   ↙       ↘
PASS      REJECT
 ↓          ↓
Validated  Unsupported
Evidence   Claim
```

The purpose of the gate is not to eliminate probabilistic reasoning.

It prevents unsupported probabilistic reasoning from becoming a persistent competency claim.

---

## 12. Evaluation Workflow

For every evaluation case:

### Step 1 — Load Case

Load:

- task description;
- engineering artifacts;
- competency rubric.

### Step 2 — Execute Baseline

Run the zero-shot LLM baseline.

Persist the structured diagnosis.

### Step 3 — Execute MidPath

Run the MidPath evidence-gated workflow using the same case.

Persist:

- evidence;
- competency classifications;
- confidence;
- unsupported claims;
- execution metadata.

### Step 4 — Compare Against Gold Standard

Compare baseline and MidPath competency classifications with the predefined Gold Standard.

### Step 5 — Calculate Metrics

Calculate:

- Diagnostic Accuracy;
- Evidence Grounding Rate;
- optional Confidence-Evidence Gap.

### Step 6 — Analyze Failure Modes

Record:

- missed evidence;
- incorrect classification;
- unsupported claims;
- false positives;
- false negatives;
- tool failures.

### Step 7 — Changelog

Every architectural change resulting from an observed failure must create an Improvement Changelog entry.

---

## 13. Challenging Cases

The dataset must contain at least one case designed to expose shallow analysis.

Example:

> An API appears correct during normal execution but contains a race condition that allows duplicate processing under concurrent requests.

The purpose is to determine whether the system evaluates surface-level correctness or actual engineering evidence.

Additional challenging cases may include:

- transaction rollback failure;
- misleading test coverage;
- correct API response with incorrect persistence behavior;
- missing validation hidden behind a successful happy path;
- superficially correct idempotency implementation that fails under concurrency.

---

## 14. Experimental Iterations

The architecture will evolve based on observed failures.

A possible progression is:

### Baseline

```text
Zero-Shot LLM
```

### Iteration 1

```text
Structured Evidence Extraction
```

### Iteration 2

```text
Evidence Contract
+
Evidence Gate
+
Deterministic Competency Mapping
```

### Iteration 3

```text
Verification Tools
```

### Iteration 4

```text
Targeted Intervention
+
Contextual Retrieval
```

These iterations are not predetermined requirements.

A component should only be retained when evidence demonstrates that it improves the workflow or addresses an observed failure mode.

---

## 15. Improvement Changelog Format

Every meaningful experiment must be documented.

| Stage | What Changed | Why | DA | EGR | Decision / Learning |
|---|---|---|---:|---:|---|
| Baseline | Zero-shot LLM | Establish starting point | TBD | TBD | Baseline |
| Iteration 1 | TBD | Observed failure | TBD | TBD | Keep / Revise / Remove |
| Iteration 2 | TBD | Observed failure | TBD | TBD | Keep / Revise / Remove |
| Final | Combined validated changes | Final workflow | TBD | TBD | Final result |

Experiments that fail or are removed must remain documented because they provide evidence about the design process.

---

## 16. Reproducibility Requirements

A third party starting from a clean environment must be able to reproduce:

1. the Gold Standard dataset;
2. the baseline execution;
3. the MidPath execution;
4. metric calculation;
5. final comparison.

The project must document:

- required environment variables;
- dependency versions;
- database setup;
- model configuration;
- commands;
- approximate runtime;
- approximate cost;
- expected outputs.

No private credentials or private learner data may be required.

Evaluation cases should use synthetic or otherwise approved data.

---

## 17. Final Evaluation Report

The final report must contain:

```text
                           BASELINE     MIDPATH      CHANGE

Diagnostic Accuracy          TBD          TBD          TBD

Evidence Grounding Rate      TBD          TBD          TBD

Runtime / Case               TBD          TBD          TBD

Approx. Cost / Case          TBD          TBD          TBD
```

The report must also identify:

- the most important improvement;
- the most significant failure mode;
- one experiment that was removed or rejected;
- the evidence supporting the final architectural decisions.

---

## 18. Success Condition

The primary experimental hypothesis is supported if:

```text
Diagnostic Accuracy(MidPath)
>
Diagnostic Accuracy(Baseline)
```

while MidPath also provides traceable evidence for its diagnostic claims.

If the experiment does not demonstrate this improvement, the result must be reported transparently rather than interpreted as success.