import { describe, expect, it } from "vitest";

import {
    scoreCompetencies,
    scoreCriticalFinding,
    scoreTraceability
} from "./score-result.js";

describe("scoreCompetencies", () => {
    it("calculates exact matches and mean absolute error", () => {
        const expected = {
            REST_API: 2,
            PERSISTENCE: 1,
            TESTING: 2,
            ERROR_HANDLING: 2,
            IDEMPOTENCY_RELIABILITY: 1
        };

        const actual = {
            REST_API: 2,
            PERSISTENCE: 2,
            TESTING: 2,
            ERROR_HANDLING: 2,
            IDEMPOTENCY_RELIABILITY: 2
        };

        const result = scoreCompetencies(
            expected,
            actual
        );

        expect(result.totalCompetencies).toBe(5);
        expect(result.exactMatches).toBe(3);
        expect(result.exactMatchRate).toBe(0.6);
        expect(result.meanAbsoluteError).toBe(0.4);

        expect(result.competencyScores).toEqual([
            {
                competency: "REST_API",
                expectedLevel: 2,
                actualLevel: 2,
                exactMatch: true,
                absoluteError: 0
            },
            {
                competency: "PERSISTENCE",
                expectedLevel: 1,
                actualLevel: 2,
                exactMatch: false,
                absoluteError: 1
            },
            {
                competency: "TESTING",
                expectedLevel: 2,
                actualLevel: 2,
                exactMatch: true,
                absoluteError: 0
            },
            {
                competency: "ERROR_HANDLING",
                expectedLevel: 2,
                actualLevel: 2,
                exactMatch: true,
                absoluteError: 0
            },
            {
                competency: "IDEMPOTENCY_RELIABILITY",
                expectedLevel: 1,
                actualLevel: 2,
                exactMatch: false,
                absoluteError: 1
            }
        ]);
    });

    it("throws when an expected competency is missing from actual scores", () => {
        expect(() =>
            scoreCompetencies(
                {
                    TESTING: 2
                },
                {}
            )
        ).toThrow(
            "Missing competency score: TESTING"
        );
    });

    it("returns zero rates for an empty competency set", () => {
        const result = scoreCompetencies(
            {},
            {}
        );

        expect(result.totalCompetencies).toBe(0);
        expect(result.exactMatches).toBe(0);
        expect(result.exactMatchRate).toBe(0);
        expect(result.meanAbsoluteError).toBe(0);
        expect(result.competencyScores).toEqual([]);
    });
});


describe("scoreCriticalFinding", () => {
    it("detects the expected critical finding when competency and severity match", () => {
        const result = scoreCriticalFinding(
            {
                competency: "IDEMPOTENCY_RELIABILITY",
                severity: "high"
            },
            [
                {
                    competency: "IDEMPOTENCY_RELIABILITY",
                    severity: "high",
                    summary:
                        "Concurrent requests may create duplicate payments."
                }
            ]
        );

        expect(result).toEqual({
            expectedCompetency:
                "IDEMPOTENCY_RELIABILITY",
            expectedSeverity: "high",
            competencyDetected: true,
            severityMatched: true,
            detected: true
        });
    });

    it("detects the competency but rejects a severity mismatch", () => {
        const result = scoreCriticalFinding(
            {
                competency: "IDEMPOTENCY_RELIABILITY",
                severity: "high"
            },
            [
                {
                    competency: "IDEMPOTENCY_RELIABILITY",
                    severity: "medium",
                    summary:
                        "A reliability issue was identified."
                }
            ]
        );

        expect(result.competencyDetected).toBe(true);
        expect(result.severityMatched).toBe(false);
        expect(result.detected).toBe(false);
    });

    it("returns not detected when the expected competency is absent", () => {
        const result = scoreCriticalFinding(
            {
                competency: "IDEMPOTENCY_RELIABILITY",
                severity: "high"
            },
            [
                {
                    competency: "TESTING",
                    severity: "high",
                    summary:
                        "A testing issue was identified."
                }
            ]
        );

        expect(result.competencyDetected).toBe(false);
        expect(result.severityMatched).toBe(false);
        expect(result.detected).toBe(false);
    });
});

describe("scoreTraceability", () => {
    it("calculates traceability coverage", () => {
        const result = scoreTraceability([
            {
                id: "A1",
                evidenceReferences: ["E1"]
            },
            {
                id: "A2",
                evidenceReferences: ["E2"]
            },
            {
                id: "A3",
                evidenceReferences: []
            }
        ]);

        expect(result.totalItems).toBe(3);
        expect(result.traceableItems).toBe(2);
        expect(result.coverage).toBeCloseTo(2 / 3);
    });

    it("returns zero coverage when no items are traceable", () => {
        const result = scoreTraceability([
            {
                id: "A1",
                evidenceReferences: []
            },
            {
                id: "A2",
                evidenceReferences: []
            }
        ]);

        expect(result.totalItems).toBe(2);
        expect(result.traceableItems).toBe(0);
        expect(result.coverage).toBe(0);
    });

    it("returns zero coverage for an empty set", () => {
        const result = scoreTraceability([]);

        expect(result.totalItems).toBe(0);
        expect(result.traceableItems).toBe(0);
        expect(result.coverage).toBe(0);
    });
});

it("counts only references that exist in the valid evidence set", () => {
    const result = scoreTraceability(
        [
            {
                id: "A1",
                evidenceReferences: ["E1"]
            },
            {
                id: "A2",
                evidenceReferences: ["E99"]
            }
        ],
        new Set(["E1", "E2"])
    );

    expect(result.totalItems).toBe(2);
    expect(result.traceableItems).toBe(1);
    expect(result.coverage).toBe(0.5);
});

it("accepts an item when at least one evidence reference is valid", () => {
    const result = scoreTraceability(
        [
            {
                id: "A1",
                evidenceReferences: ["E99", "E2"]
            }
        ],
        new Set(["E1", "E2"])
    );

    expect(result.totalItems).toBe(1);
    expect(result.traceableItems).toBe(1);
    expect(result.coverage).toBe(1);
});