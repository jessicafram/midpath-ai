import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
    scoreCompetencies,
    scoreCriticalFinding,
    scoreTraceability,
    type ScoreSummary
} from "./score-result.js";

const CASE_ID = "case-001-idempotency";

const projectRoot = resolve(process.cwd());

const goldStandardPath = resolve(
    projectRoot,
    "evaluation",
    "cases",
    CASE_ID,
    "gold-standard.json"
);

const baselinePath = resolve(
    projectRoot,
    "evaluation",
    "results",
    "baseline",
    `${CASE_ID}.json`
);

const midpathPath = resolve(
    projectRoot,
    "evaluation",
    "results",
    "midpath",
    `${CASE_ID}.json`
);

interface GoldStandard {
    competency_assessments: Array<{
        competency: string;
        expected_level: number;
    }>;

    critical_finding: {
        competency: string;
        severity: string;
    };
}

interface BaselineResult {
    competency_assessments: Array<{
        competency: string;
        level: number;
    }>;

    critical_findings: Array<{
        competency: string;
        severity: string;
        summary: string;
    }>;
}

interface MidPathResult {
    workflow: {
        evidenceAnalysis: {
            evidence: Array<{
                id: string;
            }>;
        };

        verification: {
            assessments: Array<{
                competency: string;
                level: number;
                evidenceIds?: string[];
            }>;

            criticalFindings: Array<{
                competency: string;
                severity: string;
                summary: string;
                evidenceIds?: string[];
            }>;
        };
    };
}

async function main(): Promise<void> {
    const [
        goldStandardRaw,
        baselineRaw,
        midpathRaw
    ] = await Promise.all([
        readFile(goldStandardPath, "utf8"),
        readFile(baselinePath, "utf8"),
        readFile(midpathPath, "utf8")
    ]);

    const goldStandard =
        JSON.parse(
            goldStandardRaw
        ) as GoldStandard;

    const baseline =
        JSON.parse(
            baselineRaw
        ) as BaselineResult;

    const midpath =
        JSON.parse(
            midpathRaw
        ) as MidPathResult;

    const expected =
        Object.fromEntries(
            goldStandard.competency_assessments.map(
                (assessment) => [
                    assessment.competency,
                    assessment.expected_level
                ]
            )
        );

    const baselineScores =
        toScoreRecord(
            baseline.competency_assessments
        );

    const midpathScores =
        toScoreRecord(
            midpath.workflow.verification.assessments
        );

    const baselineSummary =
        scoreCompetencies(
            expected,
            baselineScores
        );

    const midpathSummary =
        scoreCompetencies(
            expected,
            midpathScores
        );

    const baselineCriticalFinding =
        scoreCriticalFinding(
            goldStandard.critical_finding,
            baseline.critical_findings
        );

    const midpathCriticalFinding =
        scoreCriticalFinding(
            goldStandard.critical_finding,
            midpath.workflow.verification.criticalFindings
        );

    const validEvidenceIds =
        new Set(
            midpath.workflow.evidenceAnalysis.evidence.map(
                (evidence) => evidence.id
            )
        );

    const midpathAssessmentTraceability =
        scoreTraceability(
            midpath.workflow.verification.assessments.map(
                (assessment) => ({
                    id: assessment.competency,
                    evidenceReferences:
                        assessment.evidenceIds ?? []
                })
            ),
            validEvidenceIds
        );

    const midpathCriticalFindingTraceability =
        scoreTraceability(
            midpath.workflow.verification.criticalFindings.map(
                (finding, index) => ({
                    id: `${finding.competency}-${index}`,
                    evidenceReferences:
                        finding.evidenceIds ?? []
                })
            ),
            validEvidenceIds
        );

    printSummary(
        "Baseline",
        baselineSummary
    );

    printSummary(
        "MidPath",
        midpathSummary
    );

    printCriticalFinding(
        "Baseline",
        baselineCriticalFinding
    );


    printCriticalFinding(
        "MidPath",
        midpathCriticalFinding
    );

    printTraceability(
        "MidPath Assessment Traceability",
        midpathAssessmentTraceability
    );

    printTraceability(
        "MidPath Critical Finding Traceability",
        midpathCriticalFindingTraceability
    );


}

function toScoreRecord(
    assessments: Array<{
        competency: string;
        level: number;
    }>
): Record<string, number> {
    return Object.fromEntries(
        assessments.map(
            (assessment) => [
                assessment.competency,
                assessment.level
            ]
        )
    );
}

function printSummary(
    label: string,
    summary: ScoreSummary
): void {
    console.log(`\n${label}`);

    console.log(
        `Exact matches: ${summary.exactMatches}/${summary.totalCompetencies}`
    );

    console.log(
        `Exact match rate: ${(
            summary.exactMatchRate * 100
        ).toFixed(1)}%`
    );

    console.log(
        `Mean absolute error: ${summary.meanAbsoluteError.toFixed(2)}`
    );

    for (
        const score of summary.competencyScores
    ) {
        console.log(
            `${score.competency}: expected=${score.expectedLevel}, actual=${score.actualLevel}, error=${score.absoluteError}`
        );
    }
}

function printCriticalFinding(
    label: string,
    result: {
        expectedCompetency: string;
        expectedSeverity: string;
        competencyDetected: boolean;
        severityMatched: boolean;
        detected: boolean;
    }
): void {
    console.log(
        `\n${label} Critical Finding`
    );

    console.log(
        `Expected competency: ${result.expectedCompetency}`
    );

    console.log(
        `Expected severity: ${result.expectedSeverity}`
    );

    console.log(
        `Competency detected: ${result.competencyDetected}`
    );

    console.log(
        `Severity matched: ${result.severityMatched}`
    );

    console.log(
        `Critical finding detected: ${result.detected}`
    );
}

function printTraceability(
    label: string,
    result: {
        totalItems: number;
        traceableItems: number;
        coverage: number;
    }
): void {
    console.log(`\n${label}`);

    console.log(
        `Traceable items: ${result.traceableItems}/${result.totalItems}`
    );

    console.log(
        `Coverage: ${(result.coverage * 100).toFixed(1)}%`
    );
}

main().catch((error: unknown) => {
    console.error(
        "[Scoring] Failed."
    );

    if (error instanceof Error) {
        console.error(error.message);
    } else {
        console.error(error);
    }

    process.exitCode = 1;
});