import { describe, expect, it } from "vitest";

import {
    scoreCompetencies,
    scoreCriticalFinding
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


// ↓ COLE A PARTIR DAQUI, FORA DO DESCRIBE ANTERIOR

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