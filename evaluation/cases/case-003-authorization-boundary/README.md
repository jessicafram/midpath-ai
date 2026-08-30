# Case 003 — Authorization Boundary

## Purpose

This benchmark evaluates whether an engineering assessment system can distinguish authentication from resource-level authorization.

The artifacts implement a profile update workflow that receives:

1. the authenticated user identifier;
2. the target profile identifier;
3. the new profile data.

The provided tests verify successful updates, basic validation, and missing-resource behavior.

## Evaluation Focus

The benchmark measures whether the evaluator can identify missing evidence related to:

- resource ownership checks;
- access-control boundaries;
- forbidden cross-user updates;
- authentication versus authorization;
- error handling for unauthorized access;
- tests covering ownership violations.

## Benchmark Principle

Passing tests must not be interpreted as evidence that authorization boundaries are enforced correctly.

The evaluator should distinguish between:

- the presence of authenticated-user context;
- successful resource lookup and update;
- explicit enforcement that the authenticated user owns or is authorized to modify the target resource.

## Expected Critical Risk

A valid authenticated user may be able to update a resource owned by another user if the service does not verify ownership before persistence.

The benchmark therefore tests whether the evaluator recognizes the difference between:

- authentication; and
- resource-level authorization.

## Files

- `task.md` — evaluation task presented to the evaluator.
- `rubric.json` — competency scoring rubric.
- `gold-standard.json` — expected benchmark assessment.
- `artifacts/profile-service.ts` — implementation under evaluation.
- `artifacts/profile-service.test.ts` — accompanying test suite.