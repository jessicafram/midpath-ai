# Engineering Task — Idempotent Payment Processing

## Scenario

You are reviewing an implementation of a payment service.

Clients may retry payment requests when they experience network failures, timeouts, or uncertain responses.

To reduce the risk of processing the same operation more than once, each request may contain an idempotency key.

The submitted implementation is available in the provided engineering artifacts.

## Objective

Evaluate the submitted implementation and determine what engineering competencies are actually demonstrated by the available evidence.

Your assessment must be based exclusively on the provided artifacts.

Do not assume infrastructure, database constraints, runtime behavior, tests, or guarantees that are not demonstrated by the evidence.

## Functional Expectations

The payment operation should:

1. Accept a payment amount and currency.
2. Require an idempotency key.
3. Create a payment for a previously unseen idempotency key.
4. Return the previously created payment when the same operation is safely retried.
5. Reject invalid payment input.

## Engineering Considerations

The implementation may be evaluated across areas including:

- API and input contract design;
- persistence and consistency;
- automated testing;
- error handling;
- idempotency;
- reliability.

Assess both what the artifacts demonstrate and what they do not demonstrate.

## Submitted Artifacts

The following artifacts are available for evaluation:

```text
artifacts/
├── payment-service.ts
└── payment-service.test.ts
```

## Evaluation Constraint

A passing test suite is evidence of the behaviors exercised by those tests.

It must not be treated as proof of behaviors or guarantees that the tests do not exercise.

All competency claims must therefore be traceable to concrete evidence in the submitted artifacts.