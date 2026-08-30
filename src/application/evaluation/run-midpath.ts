import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { GoogleGenAI } from "@google/genai";

import {
    EvidenceAnalyst
} from "../../agents/evidence/evidence-analyst.js";

import {
    CompetencyMapper
} from "../../agents/competency/competency-mapper.js";

import {
    VerificationAgent
} from "../../agents/verification/verification-agent.js";

const CASE_ID =
    process.env.CASE_ID ??
    "case-001-idempotency";

const ARTIFACT_NAME =
    CASE_ID === "case-002-transaction-consistency"
        ? "order-service"
        : "payment-service";

const MODEL = "gemini-3.6-flash";

const projectRoot = resolve(process.cwd());

const caseDirectory = resolve(
    projectRoot,
    "evaluation",
    "cases",
    CASE_ID
);

const artifactDirectory = resolve(
    caseDirectory,
    "artifacts"
);

const outputPath = resolve(
    projectRoot,
    "evaluation",
    "results",
    "midpath",
    `${CASE_ID}.json`
);

async function main(): Promise<void> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error(
            "GEMINI_API_KEY is not defined."
        );
    }

    const [
        task,
        rubric,
        paymentService,
        paymentServiceTest
    ] = await Promise.all([
        readFile(
            resolve(caseDirectory, "task.md"),
            "utf8"
        ),
        readFile(
            resolve(caseDirectory, "rubric.json"),
            "utf8"
        ),
        readFile(
            resolve(
                artifactDirectory,
                `${ARTIFACT_NAME}.ts`
            ),
            "utf8"
        ),
        readFile(
            resolve(
                artifactDirectory,
                `${ARTIFACT_NAME}.test.ts`
            ),
            "utf8"
        )
    ]);

    const artifacts = [
        {
            path: `artifacts/${ARTIFACT_NAME}.ts`,
            content: paymentService
        },
        {
            path: `artifacts/${ARTIFACT_NAME}.test.ts`,
            content: paymentServiceTest
        }
    ];

    const ai = new GoogleGenAI({
        apiKey
    });

    const evidenceAnalyst = new EvidenceAnalyst(
        ai,
        MODEL
    );

    const competencyMapper = new CompetencyMapper(
        ai,
        MODEL
    );

    const verificationAgent = new VerificationAgent(
        ai,
        MODEL
    );

    console.log(
        `[MidPath] Running Evidence Analyst for ${CASE_ID}...`
    );

    const evidenceAnalysis =
        await evidenceAnalyst.analyze({
            caseId: CASE_ID,
            task,
            artifacts
        });

    console.log(
        `[MidPath] Evidence extracted: ${evidenceAnalysis.evidence.length}`
    );

    console.log(
        "[MidPath] Running Competency Mapper..."
    );

    const competencyMapping =
        await competencyMapper.map({
            caseId: CASE_ID,
            rubric,
            evidenceAnalysis
        });

    console.log(
        `[MidPath] Competencies mapped: ${competencyMapping.assessments.length}`
    );

    console.log(
        "[MidPath] Running Verification Agent..."
    );

    const verification =
        await verificationAgent.verify({
            caseId: CASE_ID,
            rubric,
            evidenceAnalysis,
            competencyMapping
        });

    const result = {
        caseId: CASE_ID,
        model: MODEL,
        workflow: {
            evidenceAnalysis,
            competencyMapping,
            verification
        }
    };

    await mkdir(
        dirname(outputPath),
        {
            recursive: true
        }
    );

    await writeFile(
        outputPath,
        JSON.stringify(result, null, 2),
        "utf8"
    );

    console.log(
        `[MidPath] Evaluation completed: ${outputPath}`
    );
}

main().catch((error: unknown) => {
    console.error(
        "[MidPath] Evaluation failed."
    );

    if (error instanceof Error) {
        console.error(error.message);
    } else {
        console.error(error);
    }

    process.exitCode = 1;
});