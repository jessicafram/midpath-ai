import { GoogleGenAI } from "@google/genai";

import type {
    EvidenceAnalysis
} from "../evidence/evidence-analyst.js";

import type {
    CompetencyMapping
} from "../competency/competency-mapper.js";

export interface VerifiedAssessment {
    competency: string;
    level: number;
    evidenceIds: string[];
    missingEvidence: string[];
    justification: string;
}

export interface CriticalFinding {
    severity:
    | "low"
    | "medium"
    | "high"
    | "critical";
    competency: string;
    summary: string;
    evidenceIds: string[];
}

export interface VerificationResult {
    caseId: string;
    assessments: VerifiedAssessment[];
    criticalFindings: CriticalFinding[];
    verificationNotes: string[];
}

interface VerificationAgentInput {
    caseId: string;
    rubric: string;
    evidenceAnalysis: EvidenceAnalysis;
    competencyMapping: CompetencyMapping;
}

const SYSTEM_INSTRUCTION = `
You are the Verification Agent in an evidence-driven
software engineering assessment system.

Your responsibility is to verify the traceability and
supportability of a competency assessment.

You receive:

1. the competency rubric;
2. structured evidence produced by the Evidence Analyst;
3. competency assessments produced by the Competency Mapper.

You do not receive the original engineering artifacts.

Verification rules:

1. Verify every competency assessment against the supplied evidence.
2. Remove or correct claims that are not supported by evidence.
3. Do not invent implementation details, tests, guarantees,
   infrastructure, or artifacts.
4. Use only competency levels defined by the rubric.
5. Preserve stronger scores only when the evidence supports them.
6. Reduce a score when the supplied evidence does not justify it.
7. Every evidence ID must reference evidence produced by
   the Evidence Analyst.
8. Identify critical engineering findings when they are supported
   by the available evidence.
9. Critical findings must reference relevant evidence IDs.
10. Do not use external knowledge as evidence.
11. Do not introduce competencies that are not in the rubric.
12. Do not compare the assessment to any hidden reference answer.

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
  ],
  "criticalFindings": [
    {
      "severity": "low | medium | high | critical",
      "competency": "string",
      "summary": "string",
      "evidenceIds": ["E1"]
    }
  ],
  "verificationNotes": [
    "string"
  ]
}
`;

export class VerificationAgent {
    constructor(
        private readonly ai: GoogleGenAI,
        private readonly model: string
    ) { }

    async verify(
        input: VerificationAgentInput
    ): Promise<VerificationResult> {
        const contents = `
CASE ID:
${input.caseId}

COMPETENCY RUBRIC:
${input.rubric}

EVIDENCE ANALYSIS:
${JSON.stringify(input.evidenceAnalysis, null, 2)}

COMPETENCY MAPPING:
${JSON.stringify(input.competencyMapping, null, 2)}
`;

        const response = await this.ai.models.generateContent({
            model: this.model,
            contents,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json"
            }
        });

        const rawText = response.text;

        if (!rawText) {
            throw new Error(
                "Verification Agent returned an empty response."
            );
        }

        let parsed: unknown;

        try {
            parsed = JSON.parse(rawText);
        } catch {
            throw new Error(
                `Verification Agent returned invalid JSON:\n${rawText}`
            );
        }

        return validateVerificationResult(
            parsed,
            input
        );
    }
}

function validateVerificationResult(
    value: unknown,
    input: VerificationAgentInput
): VerificationResult {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        throw new Error(
            "Verification Agent response must be an object."
        );
    }

    const candidate =
        value as Partial<VerificationResult>;

    if (candidate.caseId !== input.caseId) {
        throw new Error(
            "Verification Agent returned an unexpected caseId."
        );
    }

    if (
        !Array.isArray(candidate.assessments) ||
        !Array.isArray(candidate.criticalFindings) ||
        !Array.isArray(candidate.verificationNotes)
    ) {
        throw new Error(
            "Verification Agent returned an invalid structure."
        );
    }

    const rubric = parseRubric(input.rubric);

    const expectedCompetencies = new Set(
        rubric.competencies.map(
            (competency) =>
                competency.code ??
                competency.competency
        )
    );

    const validEvidenceIds = new Set(
        input.evidenceAnalysis.evidence.map(
            (item) => item.id
        )
    );

    if (
        candidate.assessments.length !==
        expectedCompetencies.size
    ) {
        throw new Error(
            "Verification Agent must return every rubric competency exactly once."
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
                "Verification Agent returned an invalid assessment."
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

        validateEvidenceIds(
            assessment.evidenceIds,
            validEvidenceIds
        );
    }

    for (
        const finding of candidate.criticalFindings
    ) {
        if (
            typeof finding.competency !== "string" ||
            typeof finding.summary !== "string" ||
            !Array.isArray(finding.evidenceIds) ||
            ![
                "low",
                "medium",
                "high",
                "critical"
            ].includes(finding.severity)
        ) {
            throw new Error(
                "Verification Agent returned an invalid critical finding."
            );
        }

        if (
            !expectedCompetencies.has(
                finding.competency
            )
        ) {
            throw new Error(
                `Critical finding references unknown competency: ${finding.competency}`
            );
        }

        validateEvidenceIds(
            finding.evidenceIds,
            validEvidenceIds
        );
    }

    for (const note of candidate.verificationNotes) {
        if (typeof note !== "string") {
            throw new Error(
                "Verification notes must contain only strings."
            );
        }
    }

    return candidate as VerificationResult;
}

function validateEvidenceIds(
    evidenceIds: string[],
    validEvidenceIds: Set<string>
): void {
    for (const evidenceId of evidenceIds) {
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