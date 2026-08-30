import { GoogleGenAI } from "@google/genai";

import type {
    EvidenceAnalysis
} from "../evidence/evidence-analyst.js";

export interface CompetencyAssessment {
    competency: string;
    level: number;
    evidenceIds: string[];
    missingEvidence: string[];
    justification: string;
}

export interface CompetencyMapping {
    caseId: string;
    assessments: CompetencyAssessment[];
}

interface CompetencyMapperInput {
    caseId: string;
    rubric: string;
    evidenceAnalysis: EvidenceAnalysis;
}

const SYSTEM_INSTRUCTION = `
You are the Competency Mapper in an evidence-driven
software engineering assessment system.

Your responsibility is competency classification.

You receive:

1. a competency rubric;
2. structured evidence produced by an Evidence Analyst.

You do not receive the original engineering artifacts.

Rules:

1. Evaluate every competency defined in the rubric.
2. Use only evidence contained in the provided evidence analysis.
3. Do not invent implementation details, tests, guarantees,
   infrastructure, or missing artifacts.
4. Apply only levels defined by the rubric.
5. Evidence of common behavior must not be treated as proof
   of stronger reliability guarantees.
6. Reference supporting evidence using evidence IDs.
7. When evidence is insufficient for a stronger level,
   record the relevant missing evidence.
8. Do not create additional competencies.
9. Do not modify the rubric.
10. Keep the justification grounded in the supplied evidence.

Return only valid JSON using this structure:

{
  "caseId": "string",
  "assessments": [
    {
      "competency": "string",
      "level": 0,
      "evidenceIds": ["E1"],
      "missingEvidence": ["string"],
      "justification": "string"
    }
  ]
}
`;

async function withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts = 3
): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            const message =
                error instanceof Error
                    ? error.message
                    : String(error);

            const retryable =
                message.includes('"code":503') ||
                message.includes('"code":429') ||
                message.includes("UNAVAILABLE") ||
                message.includes("RESOURCE_EXHAUSTED");

            if (!retryable || attempt === maxAttempts) {
                throw error;
            }

            const delayMs = attempt * 2000;

            console.warn(
                `[Competency Mapper] Transient model error. Retry ${attempt}/${maxAttempts} in ${delayMs}ms...`
            );

            await new Promise((resolve) =>
                setTimeout(resolve, delayMs)
            );
        }
    }

    throw lastError;
}

export class CompetencyMapper {
    constructor(
        private readonly ai: GoogleGenAI,
        private readonly model: string
    ) { }

    async map(
        input: CompetencyMapperInput
    ): Promise<CompetencyMapping> {
        const contents = `
CASE ID:
${input.caseId}

COMPETENCY RUBRIC:
${input.rubric}

EVIDENCE ANALYSIS:
${JSON.stringify(input.evidenceAnalysis, null, 2)}
`;

        const response = await withRetry(() =>
            this.ai.models.generateContent({
                model: this.model,
                contents,
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION,
                    responseMimeType: "application/json"
                }
            })
        );

        const rawText = response.text;

        if (!rawText) {
            throw new Error(
                "Competency Mapper returned an empty response."
            );
        }

        let parsed: unknown;

        try {
            parsed = JSON.parse(rawText);
        } catch {
            throw new Error(
                `Competency Mapper returned invalid JSON:\n${rawText}`
            );
        }

        return validateCompetencyMapping(
            parsed,
            input.caseId,
            input.rubric,
            input.evidenceAnalysis
        );
    }
}

function validateCompetencyMapping(
    value: unknown,
    expectedCaseId: string,
    rubricText: string,
    evidenceAnalysis: EvidenceAnalysis
): CompetencyMapping {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        throw new Error(
            "Competency Mapper response must be an object."
        );
    }

    const candidate = value as Partial<CompetencyMapping>;

    if (candidate.caseId !== expectedCaseId) {
        throw new Error(
            "Competency Mapper returned an unexpected caseId."
        );
    }

    if (!Array.isArray(candidate.assessments)) {
        throw new Error(
            "Competency Mapper response must contain an assessments array."
        );
    }

    const rubric = parseRubric(rubricText);

    const expectedCompetencies = new Set(
        rubric.competencies.map(
            (competency) =>
                competency.code ??
                competency.competency
        )
    );

    const validEvidenceIds = new Set(
        evidenceAnalysis.evidence.map(
            (item) => item.id
        )
    );

    if (
        candidate.assessments.length !==
        expectedCompetencies.size
    ) {
        throw new Error(
            "Competency Mapper must assess every rubric competency exactly once."
        );
    }

    const observedCompetencies = new Set<string>();

    for (const assessment of candidate.assessments) {
        if (
            typeof assessment.competency !== "string" ||
            typeof assessment.level !== "number" ||
            !Number.isInteger(assessment.level) ||
            assessment.level < 0 ||
            assessment.level > 3 ||
            !Array.isArray(assessment.evidenceIds) ||
            !Array.isArray(assessment.missingEvidence) ||
            typeof assessment.justification !== "string"
        ) {
            throw new Error(
                "Competency Mapper returned an invalid assessment."
            );
        }

        if (
            !expectedCompetencies.has(
                assessment.competency
            )
        ) {
            throw new Error(
                `Unknown competency: ${assessment.competency}`
            );
        }

        if (
            observedCompetencies.has(
                assessment.competency
            )
        ) {
            throw new Error(
                `Duplicate competency: ${assessment.competency}`
            );
        }

        observedCompetencies.add(
            assessment.competency
        );

        for (const evidenceId of assessment.evidenceIds) {
            if (
                typeof evidenceId !== "string" ||
                !validEvidenceIds.has(evidenceId)
            ) {
                throw new Error(
                    `Unknown evidence ID: ${evidenceId}`
                );
            }
        }
    }

    return candidate as CompetencyMapping;
}

interface ParsedRubric {
    competencies: Array<{
        code?: string;
        competency?: string;
    }>;
}

function parseRubric(
    rubricText: string
): ParsedRubric {
    let parsed: unknown;

    try {
        parsed = JSON.parse(rubricText);
    } catch {
        throw new Error(
            "Competency rubric is not valid JSON."
        );
    }

    if (
        typeof parsed !== "object" ||
        parsed === null ||
        !Array.isArray(
            (parsed as ParsedRubric).competencies
        )
    ) {
        throw new Error(
            "Competency rubric has an invalid structure."
        );
    }

    return parsed as ParsedRubric;
}