import { GoogleGenAI } from "@google/genai";

export interface EngineeringArtifact {
    path: string;
    content: string;
}

export interface EvidenceItem {
    id: string;
    artifact: string;
    observation: string;
    evidenceType:
    | "implementation"
    | "test"
    | "contract"
    | "missing";
    confidence: number;
}

export interface EvidenceAnalysis {
    caseId: string;
    evidence: EvidenceItem[];
}

interface EvidenceAnalystInput {
    caseId: string;
    task: string;
    artifacts: EngineeringArtifact[];
}

const SYSTEM_INSTRUCTION = `
You are the Evidence Analyst in an evidence-driven
software engineering assessment system.

Your responsibility is evidence extraction only.

Do not assign competency scores.
Do not classify proficiency.
Do not recommend learning resources.
Do not infer guarantees that are not demonstrated.

Analyze the provided engineering artifacts and extract
atomic, traceable engineering observations.

Evidence rules:

1. Every positive observation must reference a submitted artifact.
2. Describe observable behavior, implementation structure,
   test coverage, contracts, or missing guarantees.
3. Passing tests establish only the behavior exercised by those tests.
4. Do not assume database constraints, infrastructure,
   deployment configuration, transaction semantics, or runtime
   guarantees that are not visible in the artifacts.
5. Missing evidence may be recorded when the task implies an
   engineering guarantee that the artifacts do not demonstrate.
6. Do not assign rubric levels or competency scores.
7. Keep each evidence item focused on one engineering observation.
8. Confidence must be a number from 0 to 1.

Return only valid JSON using this structure:

{
  "caseId": "string",
  "evidence": [
    {
      "id": "E1",
      "artifact": "string",
      "observation": "string",
      "evidenceType": "implementation | test | contract | missing",
      "confidence": 0.0
    }
  ]
}
`;

export class EvidenceAnalyst {
    constructor(
        private readonly ai: GoogleGenAI,
        private readonly model: string
    ) { }

    async analyze(
        input: EvidenceAnalystInput
    ): Promise<EvidenceAnalysis> {
        const artifactPackage = input.artifacts
            .map(
                (artifact) => `
ARTIFACT: ${artifact.path}

${artifact.content}
`
            )
            .join("\n");

        const contents = `
CASE ID:
${input.caseId}

ENGINEERING TASK:
${input.task}

SUBMITTED ARTIFACTS:
${artifactPackage}
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
                "Evidence Analyst returned an empty response."
            );
        }

        let parsed: unknown;

        try {
            parsed = JSON.parse(rawText);
        } catch {
            throw new Error(
                `Evidence Analyst returned invalid JSON:\n${rawText}`
            );
        }

        return validateEvidenceAnalysis(
            parsed,
            input.caseId
        );
    }
}

function validateEvidenceAnalysis(
    value: unknown,
    expectedCaseId: string
): EvidenceAnalysis {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        throw new Error(
            "Evidence Analyst response must be an object."
        );
    }

    const candidate = value as Partial<EvidenceAnalysis>;

    if (candidate.caseId !== expectedCaseId) {
        throw new Error(
            "Evidence Analyst returned an unexpected caseId."
        );
    }

    if (!Array.isArray(candidate.evidence)) {
        throw new Error(
            "Evidence Analyst response must contain an evidence array."
        );
    }

    for (const item of candidate.evidence) {
        if (
            typeof item.id !== "string" ||
            typeof item.artifact !== "string" ||
            typeof item.observation !== "string" ||
            typeof item.confidence !== "number" ||
            item.confidence < 0 ||
            item.confidence > 1
        ) {
            throw new Error(
                "Evidence Analyst returned an invalid evidence item."
            );
        }

        const allowedTypes = [
            "implementation",
            "test",
            "contract",
            "missing"
        ];

        if (!allowedTypes.includes(item.evidenceType)) {
            throw new Error(
                `Invalid evidence type: ${item.evidenceType}`
            );
        }
    }

    return candidate as EvidenceAnalysis;
}