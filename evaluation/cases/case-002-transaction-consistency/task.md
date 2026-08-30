# Case 002 — Transaction Consistency

## Scenario

You are reviewing a backend service responsible for creating customer orders.

The service performs three operations:

1. Creates an order.
2. Decreases product inventory.
3. Records a payment attempt.

The implementation uses separate repository calls for each operation.

The existing tests pass for the normal success path.

Your task is to evaluate the engineering quality demonstrated by the implementation and its tests.

## Evaluation Goal

Assess the submitted artifacts using the provided competency rubric.

Base every conclusion only on evidence that can be traced to the supplied artifacts.

Pay particular attention to:

- persistence behavior;
- consistency between related writes;
- failure handling;
- transactional guarantees;
- test coverage;
- behavior under partial failures.

Do not assume guarantees that are not demonstrated by the artifacts.

## Artifacts

The evaluation includes:

- `artifacts/order-service.ts`
- `artifacts/order-service.test.ts`

## Important Constraint

Passing tests must not be treated as proof that the implementation is safe under all failure scenarios.

The evaluator should distinguish between:

- behavior explicitly demonstrated by tests;
- behavior visible in the implementation;
- guarantees that are missing or unsupported by evidence.