# Case 001 — Idempotent Payment Processing

## Overview

This benchmark case evaluates whether a software engineering competency assessment system can distinguish between **passing observable behavior** and **strong evidence of production-grade reliability**.

The submitted payment service implements an idempotency mechanism and passes its provided automated test suite.

However, the case is intentionally designed so that passing tests alone are not sufficient to establish all relevant engineering guarantees.

The evaluator must base every competency assessment on evidence contained in the submitted artifacts.

---

## Case Metadata

| Field | Value |
|---|---|
| Case ID | `case-001-idempotency` |
| Version | `1.0.0` |
| Difficulty | Challenging |
| Domain | Backend Engineering |
| Primary Concern | Idempotency & Reliability |
| Language | TypeScript |
| Test Framework | Vitest |

---

## Evaluation Objective

The case measures whether an evaluator can:

1. identify engineering evidence present in source code and tests;
2. distinguish demonstrated behavior from assumed behavior;
3. identify missing evidence required for stronger competency claims;
4. classify competencies using the shared `0–3` evidence scale;
5. trace diagnostic conclusions back to concrete artifacts.

The evaluator must not infer infrastructure, database guarantees, runtime behavior, or safeguards that are not demonstrated by the submitted artifacts.

---

## Competencies Evaluated

The case evaluates the following competency dimensions:

- `REST_API` — REST API Design & Contracts
- `PERSISTENCE` — Data Persistence & Relational Modeling
- `TESTING` — Automated Testing
- `ERROR_HANDLING` — Error Handling
- `IDEMPOTENCY_RELIABILITY` — Idempotency & Reliability

The competency definitions and scoring criteria are defined in:

```text
rubric.json
```

---

## Evidence Scale

All competencies use the same four-level evidence scale:

| Level | Classification |
|---:|---|
| 0 | No Evidence |
| 1 | Weak Evidence |
| 2 | Partial Evidence |
| 3 | Strong Evidence |

A higher score requires stronger evidence.

Implementation intent alone is not sufficient to establish a strong competency claim.

---

## Case Structure

```text
case-001-idempotency/
├── artifacts/
│   ├── payment-service.ts
│   └── payment-service.test.ts
├── gold-standard.json
├── README.md
├── rubric.json
└── task.md
```

### `task.md`

Defines the engineering scenario, functional expectations, submitted artifacts, and evaluation constraints.

### `rubric.json`

Defines the competency taxonomy and the evidence-based `0–3` classification criteria.

### `artifacts/`

Contains the engineering artifacts submitted for evaluation.

### `gold-standard.json`

Contains the reference assessment used to measure diagnostic accuracy.

The Gold Standard must **never be provided to the evaluated system**.

---

## Submitted Engineering Artifacts

### `payment-service.ts`

Contains the payment service implementation and repository contracts.

The implementation includes:

- payment input validation;
- idempotency-key validation;
- existing-record lookup;
- payment creation;
- idempotency-record persistence.

### `payment-service.test.ts`

Contains the submitted automated test suite.

The suite exercises:

- successful payment creation;
- sequential reuse of an idempotency key;
- missing idempotency-key rejection;
- invalid payment-amount rejection;
- currency normalization.

Passing these tests establishes evidence only for the behaviors actually exercised by the suite.

---

## Experimental Protocol

The same observable evaluation package must be provided independently to both evaluation systems:

```text
task.md
   +
rubric.json
   +
artifacts/
```

The execution flow is:

```text
                    Evaluation Package
                           |
               +-----------+-----------+
               |                       |
               v                       v
          Baseline LLM              MidPath AI
               |                       |
               v                       v
        baseline-result          midpath-result
               |                       |
               +-----------+-----------+
                           |
                           v
                   Gold Standard
                           |
                           v
                     Scoring Layer
```

The evaluated systems must not receive:

```text
gold-standard.json
```

during diagnosis.

---

## Fair Comparison Requirements

For a valid comparison:

1. Baseline and MidPath receive the same task.
2. Baseline and MidPath receive the same rubric.
3. Baseline and MidPath receive the same artifacts.
4. Neither system receives the Gold Standard.
5. Both systems produce structured competency assessments.
6. Results are compared against the same reference assessment.

This isolates the evaluation architecture as the primary experimental variable.

---

## Expected Gold Standard Levels

The reference assessment for this case is:

| Competency | Expected Level |
|---|---:|
| `REST_API` | 2 |
| `PERSISTENCE` | 1 |
| `TESTING` | 2 |
| `ERROR_HANDLING` | 2 |
| `IDEMPOTENCY_RELIABILITY` | 1 |

Detailed evidence and justification remain in:

```text
gold-standard.json
```

---

## Critical Benchmark Property

This case intentionally creates a distinction between:

```text
observable passing behavior
```

and:

```text
evidence of stronger reliability guarantees
```

The provided test suite passes while leaving important behavior unverified.

Therefore:

> Passing tests are evidence of the behavior exercised by those tests, not proof of guarantees that the tests do not exercise.

This distinction is central to the MidPath AI evidence-driven evaluation model.

---

## Reproducibility

The submitted test artifact can be executed from the project root with:

```bash
npx vitest run evaluation/cases/case-001-idempotency/artifacts/payment-service.test.ts
```

Expected result:

```text
Test Files  1 passed
Tests       5 passed
```

This successful execution is part of the benchmark evidence but does not replace competency-level analysis.

---

## Benchmark Integrity

When executing this case programmatically, the evaluation runner must load only:

```text
task.md
rubric.json
artifacts/payment-service.ts
artifacts/payment-service.test.ts
```

The following file is reserved exclusively for post-evaluation scoring:

```text
gold-standard.json
```

This separation prevents reference-answer leakage and preserves the validity of the experiment.