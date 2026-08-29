# MidPath AI — Problem Statement

> **Evidence-Driven Engineering Readiness**

## 1. Problem Definition

There is a significant gap between **learning software engineering concepts** and **demonstrating software engineering competence**.

Computer Science students and early-career software engineers can complete courses, tutorials, coding exercises, and personal projects without having a reliable way to determine which engineering competencies they can actually demonstrate in realistic technical scenarios.

Traditional learning signals such as course completion, self-assessment, multiple-choice tests, and isolated coding exercises often measure knowledge or task completion, but provide limited evidence about whether a learner can apply engineering principles to real artifacts such as source code, automated tests, persistence models, API contracts, and architectural decisions.

The core problem is therefore not simply:

> "What does the learner know?"

It is:

> **"What engineering competence can the learner demonstrate through observable evidence?"**

---

## 2. Target User

The primary users are:

> **Computer Science students and early-career software engineers seeking to identify and close gaps in practical Backend Engineering competence.**

These learners are actively developing their technical skills but often lack an objective mechanism for understanding:

- which competencies they can already demonstrate;
- which competencies lack sufficient evidence;
- which specific gaps should be addressed next;
- whether a learning intervention actually improved their competence.

MidPath AI intentionally focuses on the learner rather than recruiters or hiring organizations.

---

## 3. Current Situation

Engineering readiness is commonly inferred from signals such as:

- course completion;
- certifications;
- self-assessment;
- multiple-choice tests;
- algorithmic exercises;
- portfolio projects;
- generic AI feedback.

These signals can be useful, but they do not necessarily establish whether a learner can apply engineering principles reliably in realistic situations.

For example, a learner may correctly explain idempotency conceptually while failing to implement duplicate-request protection in an API.

Likewise, a learner may understand database transactions theoretically while failing to handle rollback correctly during partial failure.

This creates an important distinction:

```text
Conceptual Knowledge
        ≠
Demonstrated Engineering Competence
```

---

## 4. Bottleneck

The primary bottleneck is the **lack of an evidence-driven competency feedback loop**.

Traditional assessments often focus on whether an answer is correct.

MidPath AI focuses instead on the engineering evidence behind the answer.

Examples of relevant evidence include:

- source code;
- automated tests;
- API contracts;
- database schemas;
- error-handling strategies;
- transaction boundaries;
- concurrency behavior;
- architecture decisions;
- execution results;
- technical reasoning attached to an artifact.

Without this evidence layer, competency diagnosis can become subjective, generic, or difficult to reproduce.

---

## 5. User Impact

Without reliable competency diagnosis, learners may spend significant time consuming broad educational content without knowing which engineering capabilities they can actually demonstrate or which specific gap should be addressed next.

This can lead to:

- inefficient learning paths;
- repeated study of already-mastered concepts;
- overlooked practical weaknesses;
- overconfidence in theoretical knowledge;
- difficulty translating learning into engineering practice.

The intended value of MidPath AI is therefore not to provide more content.

It is to improve the **precision of the feedback loop between practice, evidence, diagnosis, intervention, and verification**.

---

## 6. Core Hypothesis

The primary hypothesis of MidPath AI is:

> **An evidence-gated agentic workflow that analyzes observable engineering artifacts can improve the accuracy and traceability of competency-gap diagnosis compared with a simple zero-shot LLM baseline.**

This hypothesis is intentionally falsifiable.

The project does not assume that the agentic architecture is better.

It evaluates whether the architecture produces measurable improvement over the baseline using a predefined Gold Standard Dataset and competency rubric.

The expected causal chain is:

```text
Engineering Artifacts
        ↓
Evidence Extraction
        ↓
Evidence Validation
        ↓
Competency Diagnosis
        ↓
Gap Identification
        ↓
Targeted Intervention
        ↓
New Engineering Artifact
        ↓
Verification
        ↓
Evidence Delta
```

---

## 7. Proposed Value

MidPath AI aims to provide three forms of value.

### 7.1 Evidence-Based Diagnosis

Instead of producing generic feedback such as:

> "You need to improve testing."

MidPath should produce traceable observations such as:

> "The implementation covers the successful request path but provides no evidence of duplicate-request handling or concurrency testing."

---

### 7.2 Targeted Intervention

The system identifies the smallest practical intervention capable of generating evidence for the missing competency.

Example:

```text
Observed Gap
    ↓
Idempotency / Concurrency
    ↓
Targeted Micro-Challenge
    ↓
Implement duplicate-request protection
and provide a concurrency test
```

---

### 7.3 Closed-Loop Verification

After the learner completes the intervention, the system evaluates the new artifacts and determines whether new competency evidence was produced.

The workflow therefore does not stop at recommendation.

```text
Assess
   ↓
Diagnose
   ↓
Intervene
   ↓
Reassess
   ↓
Measure
```

---

## 8. Scope

The hackathon MVP intentionally uses a narrow vertical slice.

### Domain

**Backend Engineering**

### Initial Competencies

1. REST API Design & Contracts
2. Data Persistence & Relational Modeling
3. Automated Testing
4. Error Handling
5. Idempotency & Reliability

The goal is not to create a complete engineering competency framework.

The goal is to demonstrate that the evidence-driven workflow can reliably evaluate a small, well-defined competency domain.

---

## 9. What Counts as Evidence?

An engineering claim must be supported by an observable artifact.

Examples include:

| Evidence Type | Example |
|---|---|
| Source Code | Transaction boundary implementation |
| Automated Test | Duplicate-request test |
| API Contract | Correct HTTP status semantics |
| Database Schema | Unique constraint supporting idempotency |
| Execution Result | Failing concurrency test |
| Architecture Artifact | Documented failure-handling strategy |
| Technical Reasoning | Justification linked to an implementation decision |

Evidence must be traceable to its source.

---

## 10. Evidence Contract

Every competency claim generated by MidPath must conform to an Evidence Contract.

Conceptually:

```json
{
  "competency": "idempotency",
  "level": 1,
  "confidence": 0.91,
  "evidence": [
    {
      "artifact": "src/payment.ts",
      "location": "L42-L61",
      "observation": "Request processing contains no idempotency-key validation."
    }
  ],
  "missing_evidence": [
    "duplicate-request test",
    "concurrent-request test"
  ],
  "reasoning_summary": "The implementation handles successful requests but provides insufficient evidence of duplicate-request safety."
}
```

The architectural rule is:

> **No strong competency claim without traceable evidence.**

An LLM may generate a hypothesis about competency, but the hypothesis must satisfy the Evidence Contract before it can influence the learner's competency profile.

---

## 11. Competency Scale

For the hackathon evaluation, competencies use a discrete four-level scale:

| Level | Meaning |
|---:|---|
| 0 | No Evidence |
| 1 | Weak Evidence |
| 2 | Partial Evidence |
| 3 | Strong Evidence |

The scale is deliberately small to reduce ambiguity and enable reproducible comparison between the Gold Standard, baseline, and MidPath AI.

---

## 12. Success Criteria

The primary success criterion is:

> **MidPath AI achieves higher Competency Diagnostic Accuracy than the zero-shot LLM baseline on the same Gold Standard evaluation cases.**

Secondary success criteria include:

- higher Evidence Grounding Rate;
- traceable competency claims;
- reproducible evaluation results;
- successful identification of challenging or contradictory cases;
- measurable evidence improvement after a targeted intervention.

The system will not be considered successful merely because it produces plausible feedback.

Improvement must be demonstrated through evaluation.

---

## 13. Evaluation Direction

A Gold Standard Dataset will contain at least 10 engineering evaluation cases.

Each case contains:

- a task description;
- engineering artifacts;
- expected competency evidence;
- a predefined competency rubric;
- Gold Standard competency classifications.

Both the baseline and MidPath AI receive equivalent evaluation inputs.

Their outputs are compared against the same Gold Standard.

The primary experiment therefore follows:

```text
                    GOLD STANDARD
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
         ZERO-SHOT LLM         MIDPATH AI
            BASELINE           SOLUTION
                │                 │
                ▼                 ▼
           DIAGNOSIS           DIAGNOSIS
                │                 │
                └────────┬────────┘
                         ▼
                    COMPARISON
                         ↓
               DIAGNOSTIC ACCURACY
```

---

## 14. Exploratory Signal: Confidence-Evidence Gap

MidPath may optionally collect a learner's self-assessed confidence before evaluation.

This enables an exploratory comparison between:

```text
Perceived Competence
        vs.
Observed Evidence
```

The resulting **Confidence-Evidence Gap** is useful as a product insight, but it is not the primary success metric of the hackathon experiment.

---

## 15. Non-Goals

The hackathon MVP is intentionally not:

- a recruitment platform;
- a job-matching system;
- a hiring decision engine;
- a resume builder;
- a generic AI tutor;
- a complete Learning Management System;
- a replacement for qualified human review;
- an assessment of every Software Engineering competency;
- an assessment of Frontend or UX skills;
- a system that claims to determine whether someone is "Senior";
- a production-scale educational platform.

The MVP exists to validate one specific hypothesis:

> **Can evidence-gated agentic analysis improve practical engineering competency diagnosis over a simple LLM baseline?**