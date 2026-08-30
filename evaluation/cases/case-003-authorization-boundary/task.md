# Case 003 — Resource Update Review

## Scenario

You are reviewing a backend service responsible for updating customer-owned resources.

The service receives:

- the authenticated user identifier;
- the resource identifier;
- the new resource data.

The existing tests pass for the expected update flow.

Your task is to evaluate the engineering quality demonstrated by the implementation and its tests.

## Evaluation Goal

Assess the submitted artifacts using the provided competency rubric.

Base every conclusion only on evidence that can be traced to the supplied artifacts.

Consider:

- API behavior;
- persistence behavior;
- access control;
- error handling;
- test coverage;
- assumptions made about the authenticated user and the target resource.

Do not assume guarantees that are not demonstrated by the artifacts.

## Artifacts

The evaluation includes:

- `artifacts/profile-service.ts`
- `artifacts/profile-service.test.ts`

## Important Constraint

Passing tests must not be treated as proof that all access-control boundaries are enforced correctly.

The evaluator should distinguish between:

- behavior explicitly demonstrated by tests;
- behavior visible in the implementation;
- guarantees that are missing or unsupported by evidence.