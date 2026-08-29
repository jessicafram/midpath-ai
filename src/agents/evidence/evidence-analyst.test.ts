import { describe, expect, it, vi } from "vitest";

import {
    EvidenceAnalyst
} from "./evidence-analyst.js";

describe("EvidenceAnalyst", () => {
    it("returns validated structured evidence", async () => {
        const generateContent = vi.fn().mockResolvedValue({
            text: JSON.stringify({
                caseId: "case-test",
                evidence: [
                    {
                        id: "E1",
                        artifact: "service.ts",
                        observation:
                            "The service validates the request before persistence.",
                        evidenceType: "implementation",
                        confidence: 0.95
                    }
                ]
            })
        });

        const ai = {
            models: {
                generateContent
            }
        };

        const analyst = new EvidenceAnalyst(
            ai as never,
            "test-model"
        );

        const result = await analyst.analyze({
            caseId: "case-test",
            task: "Evaluate the submitted implementation.",
            artifacts: [
                {
                    path: "service.ts",
                    content: "export const service = {};"
                }
            ]
        });

        expect(result.caseId).toBe("case-test");
        expect(result.evidence).toHaveLength(1);

        expect(result.evidence[0]).toEqual({
            id: "E1",
            artifact: "service.ts",
            observation:
                "The service validates the request before persistence.",
            evidenceType: "implementation",
            confidence: 0.95
        });

        expect(generateContent).toHaveBeenCalledTimes(1);
    });

    it("rejects evidence with confidence outside the valid range", async () => {
        const generateContent = vi.fn().mockResolvedValue({
            text: JSON.stringify({
                caseId: "case-test",
                evidence: [
                    {
                        id: "E1",
                        artifact: "service.ts",
                        observation: "Some observation.",
                        evidenceType: "implementation",
                        confidence: 1.5
                    }
                ]
            })
        });

        const ai = {
            models: {
                generateContent
            }
        };

        const analyst = new EvidenceAnalyst(
            ai as never,
            "test-model"
        );

        await expect(
            analyst.analyze({
                caseId: "case-test",
                task: "Evaluate the implementation.",
                artifacts: [
                    {
                        path: "service.ts",
                        content: "export const service = {};"
                    }
                ]
            })
        ).rejects.toThrow(
            "Evidence Analyst returned an invalid evidence item."
        );
    });

    it("rejects an unexpected caseId", async () => {
        const generateContent = vi.fn().mockResolvedValue({
            text: JSON.stringify({
                caseId: "wrong-case",
                evidence: []
            })
        });

        const ai = {
            models: {
                generateContent
            }
        };

        const analyst = new EvidenceAnalyst(
            ai as never,
            "test-model"
        );

        await expect(
            analyst.analyze({
                caseId: "case-test",
                task: "Evaluate the implementation.",
                artifacts: []
            })
        ).rejects.toThrow(
            "Evidence Analyst returned an unexpected caseId."
        );
    });
});