# Case 002 — Transaction Consistency

## Purpose

This benchmark evaluates whether an engineering assessment system can distinguish successful happy-path behavior from demonstrated transactional safety.

The artifacts implement an order creation workflow involving multiple related persistence operations:

1. create an order;
2. decrease inventory;
3. record a payment attempt.

The provided tests verify the successful workflow and basic input validation.

## Evaluation Focus

The benchmark measures whether the evaluator can identify missing evidence related to:

- atomicity across related writes;
- rollback or compensation;
- partial failure handling;
- persistence consistency;
- transactional reliability;
- tests covering failure scenarios.

## Benchmark Principle

Passing tests must not be interpreted as evidence that the workflow is transactionally safe.

The evaluator should distinguish between behavior demonstrated by the current test suite and guarantees that would require additional implementation or evidence.

## Expected Critical Risk

A failure occurring after an earlier persistence operation succeeds may leave the system in a partially committed state.

The benchmark therefore tests whether the evaluator recognizes the difference between:

- successful sequential execution; and
- atomic execution with consistency guarantees.

## Files

- `task.md` — evaluation task presented to the evaluator.
- `rubric.json` — competency scoring rubric.
- `gold-standard.json` — expected benchmark assessment.
- `artifacts/order-service.ts` — implementation under evaluation.
- `artifacts/order-service.test.ts` — accompanying test suite.