import { describe, expect, it, vi } from "vitest";

import {
    CompetencyMapper
} from "./competency-mapper.js";

import type {
    EvidenceAnalysis
} from "../evidence/evidence-analyst.js";

const rubric = JSON.stringify({
    competencies: [
        {
            code: "TESTING"
        },
        {
            code: "RELIABILITY"
        }
    ]
});

const evidenceAnalysis: EvidenceAnalysis = {
    caseId: "case-test",
    evidence: [
        {
            id: "E1",
            artifact: "service.test.ts",
            observation: "A successful request is tested.",
            evidenceType: "test",
            confidence: 0.95
        },
        {
            id: "E2",
            artifact: "service.ts",
            observation:
                "No atomic persistence guarantee is demonstrated.",
            evidenceType: "missing",
            confidence: 0.9
        }
    ]
};

describe("CompetencyMapper", () => {
    it("returns a validated mapping for every rubric competency", async () => {
        const generateContent = vi.fn().mockResolvedValue({
            text: JSON.stringify({
                caseId: "case-test",
                assessments: [
                    {
                        competency: "TESTING",
                        level: 2,
                        evidenceIds: ["E1"],
                        missingEvidence: [
                            "Failure scenarios are not tested."
                        ],
                        justification:
                            "The evidence demonstrates some automated testing."
                    },
                    {
                        competency: "RELIABILITY",
                        level: 1,
                        evidenceIds: ["E2"],
                        missingEvidence: [
                            "Atomic persistence is not demonstrated."
                        ],
                        justification:
                            "The available evidence does not demonstrate strong reliability guarantees."
                    }
                ]
            })
        });

        const ai = {
            models: {
                generateContent
            }
        };

        const mapper = new CompetencyMapper(
            ai as never,
            "test-model"
        );

        const result = await mapper.map({
            caseId: "case-test",
            rubric,
            evidenceAnalysis
        });

        expect(result.caseId).toBe("case-test");
        expect(result.assessments).toHaveLength(2);

        expect(
            result.assessments.map(
                (assessment) => assessment.competency
            )
        ).toEqual([
            "TESTING",
            "RELIABILITY"
        ]);

        expect(generateContent).toHaveBeenCalledTimes(1);
    });

    it("rejects an evidence ID that was not produced by the Evidence Analyst", async () => {
        const generateContent = vi.fn().mockResolvedValue({
            text: JSON.stringify({
                caseId: "case-test",
                assessments: [
                    {
                        competency: "TESTING",
                        level: 2,
                        evidenceIds: ["E999"],
                        missingEvidence: [],
                        justification: "Some justification."
                    },
                    {
                        competency: "RELIABILITY",
                        level: 1,
                        evidenceIds: ["E2"],
                        missingEvidence: [],
                        justification: "Some justification."
                    }
                ]
            })
        });

        const mapper = new CompetencyMapper(
            {
                models: {
                    generateContent
                }
            } as never,
            "test-model"
        );

        await expect(
            mapper.map({
                caseId: "case-test",
                rubric,
                evidenceAnalysis
            })
        ).rejects.toThrow(
            "Unknown evidence ID: E999"
        );
    });

    it("rejects a missing rubric competency", async () => {
        const generateContent = vi.fn().mockResolvedValue({
            text: JSON.stringify({
                caseId: "case-test",
                assessments: [
                    {
                        competency: "TESTING",
                        level: 2,
                        evidenceIds: ["E1"],
                        missingEvidence: [],
                        justification: "Some justification."
                    }
                ]
            })
        });

        const mapper = new CompetencyMapper(
            {
                models: {
                    generateContent
                }
            } as never,
            "test-model"
        );

        await expect(
            mapper.map({
                caseId: "case-test",
                rubric,
                evidenceAnalysis
            })
        ).rejects.toThrow(
            "Competency Mapper must assess every rubric competency exactly once."
        );
    });

    it("rejects a competency level outside the rubric scale", async () => {
        const generateContent = vi.fn().mockResolvedValue({
            text: JSON.stringify({
                caseId: "case-test",
                assessments: [
                    {
                        competency: "TESTING",
                        level: 7,
                        evidenceIds: ["E1"],
                        missingEvidence: [],
                        justification: "Some justification."
                    },
                    {
                        competency: "RELIABILITY",
                        level: 1,
                        evidenceIds: ["E2"],
                        missingEvidence: [],
                        justification: "Some justification."
                    }
                ]
            })
        });

        const mapper = new CompetencyMapper(
            {
                models: {
                    generateContent
                }
            } as never,
            "test-model"
        );

        await expect(
            mapper.map({
                caseId: "case-test",
                rubric,
                evidenceAnalysis
            })
        ).rejects.toThrow(
            "Competency Mapper returned an invalid assessment."
        );
    });
});