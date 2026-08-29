import { describe, expect, it, vi } from "vitest";

import {
    VerificationAgent
} from "./verification-agent.js";

import type {
    EvidenceAnalysis
} from "../evidence/evidence-analyst.js";

import type {
    CompetencyMapping
} from "../competency/competency-mapper.js";

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
            observation:
                "A successful request is covered by an automated test.",
            evidenceType: "test",
            confidence: 0.95
        },
        {
            id: "E2",
            artifact: "service.ts",
            observation:
                "Atomic persistence is not demonstrated.",
            evidenceType: "missing",
            confidence: 0.9
        }
    ]
};

const competencyMapping: CompetencyMapping = {
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
                "Some automated testing is demonstrated."
        },
        {
            competency: "RELIABILITY",
            level: 1,
            evidenceIds: ["E2"],
            missingEvidence: [
                "Atomic persistence is not demonstrated."
            ],
            justification:
                "Strong reliability guarantees are not demonstrated."
        }
    ]
};

describe("VerificationAgent", () => {
    it("returns a validated verification result", async () => {
        const generateContent = vi.fn().mockResolvedValue({
            text: JSON.stringify({
                caseId: "case-test",
                assessments: competencyMapping.assessments,
                criticalFindings: [
                    {
                        severity: "high",
                        competency: "RELIABILITY",
                        summary:
                            "Atomic persistence is not demonstrated.",
                        evidenceIds: ["E2"]
                    }
                ],
                verificationNotes: [
                    "The reliability assessment is supported by the available evidence."
                ]
            })
        });

        const agent = new VerificationAgent(
            {
                models: {
                    generateContent
                }
            } as never,
            "test-model"
        );

        const result = await agent.verify({
            caseId: "case-test",
            rubric,
            evidenceAnalysis,
            competencyMapping
        });

        expect(result.caseId).toBe("case-test");
        expect(result.assessments).toHaveLength(2);
        expect(result.criticalFindings).toHaveLength(1);
        expect(result.verificationNotes).toHaveLength(1);

        expect(generateContent).toHaveBeenCalledTimes(1);
    });

    it("rejects an unknown evidence ID in an assessment", async () => {
        const generateContent = vi.fn().mockResolvedValue({
            text: JSON.stringify({
                caseId: "case-test",
                assessments: [
                    {
                        ...competencyMapping.assessments[0],
                        evidenceIds: ["E999"]
                    },
                    competencyMapping.assessments[1]
                ],
                criticalFindings: [],
                verificationNotes: []
            })
        });

        const agent = new VerificationAgent(
            {
                models: {
                    generateContent
                }
            } as never,
            "test-model"
        );

        await expect(
            agent.verify({
                caseId: "case-test",
                rubric,
                evidenceAnalysis,
                competencyMapping
            })
        ).rejects.toThrow(
            "Unknown evidence ID: E999"
        );
    });

    it("rejects an unknown evidence ID in a critical finding", async () => {
        const generateContent = vi.fn().mockResolvedValue({
            text: JSON.stringify({
                caseId: "case-test",
                assessments: competencyMapping.assessments,
                criticalFindings: [
                    {
                        severity: "high",
                        competency: "RELIABILITY",
                        summary: "Unsupported finding.",
                        evidenceIds: ["E999"]
                    }
                ],
                verificationNotes: []
            })
        });

        const agent = new VerificationAgent(
            {
                models: {
                    generateContent
                }
            } as never,
            "test-model"
        );

        await expect(
            agent.verify({
                caseId: "case-test",
                rubric,
                evidenceAnalysis,
                competencyMapping
            })
        ).rejects.toThrow(
            "Unknown evidence ID: E999"
        );
    });

    it("rejects a critical finding for an unknown competency", async () => {
        const generateContent = vi.fn().mockResolvedValue({
            text: JSON.stringify({
                caseId: "case-test",
                assessments: competencyMapping.assessments,
                criticalFindings: [
                    {
                        severity: "high",
                        competency: "UNKNOWN",
                        summary: "Invalid competency.",
                        evidenceIds: ["E2"]
                    }
                ],
                verificationNotes: []
            })
        });

        const agent = new VerificationAgent(
            {
                models: {
                    generateContent
                }
            } as never,
            "test-model"
        );

        await expect(
            agent.verify({
                caseId: "case-test",
                rubric,
                evidenceAnalysis,
                competencyMapping
            })
        ).rejects.toThrow(
            "Critical finding references unknown competency: UNKNOWN"
        );
    });

    it("rejects a result with a missing competency assessment", async () => {
        const generateContent = vi.fn().mockResolvedValue({
            text: JSON.stringify({
                caseId: "case-test",
                assessments: [
                    competencyMapping.assessments[0]
                ],
                criticalFindings: [],
                verificationNotes: []
            })
        });

        const agent = new VerificationAgent(
            {
                models: {
                    generateContent
                }
            } as never,
            "test-model"
        );

        await expect(
            agent.verify({
                caseId: "case-test",
                rubric,
                evidenceAnalysis,
                competencyMapping
            })
        ).rejects.toThrow(
            "Verification Agent must return every rubric competency exactly once."
        );
    });
});