import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { GoogleGenAI } from "@google/genai";

const CASE_ID =
    process.env.CASE_ID ??
    "case-001-idempotency";

const ROOT_DIR = process.cwd();

const CASE_DIR = path.join(
    ROOT_DIR,
    "evaluation",
    "cases",
    CASE_ID
);

const PROMPT_PATH = path.join(
    ROOT_DIR,
    "evaluation",
    "baseline",
    "prompts",
    "baseline-system.txt"
);

const RESULT_DIR = path.join(
    ROOT_DIR,
    "evaluation",
    "results",
    "baseline"
);

const RESULT_PATH = path.join(
    RESULT_DIR,
    `${CASE_ID}.json`
);

async function loadText(filePath: string): Promise<string> {
    return readFile(filePath, "utf8");
}

async function main(): Promise<void> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error(
            "GEMINI_API_KEY is not defined. Add it to your local .env file."
        );
    }

    const [
        systemPrompt,
        task,
        rubric,
        paymentService,
        paymentServiceTest
    ] = await Promise.all([
        loadText(PROMPT_PATH),
        loadText(path.join(CASE_DIR, "task.md")),
        loadText(path.join(CASE_DIR, "rubric.json")),
        loadText(
            path.join(
                CASE_DIR,
                "artifacts",
                "payment-service.ts"
            )
        ),
        loadText(
            path.join(
                CASE_DIR,
                "artifacts",
                "payment-service.test.ts"
            )
        )
    ]);

    const ai = new GoogleGenAI({
        apiKey
    });

    const evaluationInput = `
CASE ID:
${CASE_ID}

TASK:
${task}

RUBRIC:
${rubric}

ARTIFACT: artifacts/payment-service.ts
${paymentService}

ARTIFACT: artifacts/payment-service.test.ts
${paymentServiceTest}
`;

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: evaluationInput,
        config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json"
        }
    });

    const rawText = response.text;

    if (!rawText) {
        throw new Error(
            "Gemini returned an empty response."
        );
    }

    let parsedResult: unknown;

    try {
        parsedResult = JSON.parse(rawText);
    } catch {
        throw new Error(
            `Gemini returned invalid JSON:\n${rawText}`
        );
    }

    await mkdir(RESULT_DIR, {
        recursive: true
    });

    await writeFile(
        RESULT_PATH,
        `${JSON.stringify(parsedResult, null, 2)}\n`,
        "utf8"
    );

    console.log(
        `Baseline evaluation completed: ${RESULT_PATH}`
    );
}

main().catch((error: unknown) => {
    console.error(
        error instanceof Error
            ? error.message
            : error
    );

    process.exitCode = 1;
});