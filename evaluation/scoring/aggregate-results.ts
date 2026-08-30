import fs from "node:fs";
import path from "node:path";

const RESULTS_DIR = path.resolve(
    "evaluation/results"
);

const CASES_DIR = path.resolve(
    "evaluation/cases"
);

interface NormalizedAssessment {
    competency: string;
    level: number;
}

interface NormalizedCriticalFinding {
    competency: string;
    severity: string;
}

interface CaseSummary {
    caseId: string;
    baselineAvailable: boolean;
    midpathAvailable: boolean;
}

interface BaselineResult {
    case_id: string;
    competency_assessments: Array<{
        competency: string;
        level: number;
    }>;
}

interface MidPathResult {
    caseId: string;
    workflow: {
        competencyMapping: {
            assessments: Array<{
                competency: string;
                level: number;
            }>;
        };
    };
}

interface GoldStandard {
    case_id: string;
    competency_assessments: Array<{
        competency: string;
        expected_level: number;
    }>;
    critical_finding: {
        competency: string;
        severity: string;
    };
}

interface CompetencyMetrics {
    total: number;
    exactMatches: number;
    exactMatchRate: number;
    meanAbsoluteError: number;
}

interface AggregatedCaseResult {
    caseId: string;
    baseline?: CompetencyMetrics;
    midpath?: CompetencyMetrics;
}

function readJson<T>(filePath: string): T {
    return JSON.parse(
        fs.readFileSync(filePath, "utf-8")
    ) as T;
}

function normalizeBaseline(
    result: BaselineResult
): NormalizedAssessment[] {
    return result.competency_assessments.map(
        (assessment) => ({
            competency: assessment.competency,
            level: assessment.level
        })
    );
}

function normalizeMidPath(
    result: MidPathResult
): NormalizedAssessment[] {
    return result.workflow.competencyMapping.assessments.map(
        (assessment) => ({
            competency: assessment.competency,
            level: assessment.level
        })
    );
}

function normalizeGoldStandard(
    result: GoldStandard
): NormalizedAssessment[] {
    return result.competency_assessments.map(
        (assessment) => ({
            competency: assessment.competency,
            level: assessment.expected_level
        })
    );
}

function calculateCompetencyMetrics(
    actual: NormalizedAssessment[],
    expected: NormalizedAssessment[]
): CompetencyMetrics {
    const expectedByCompetency = new Map(
        expected.map((assessment) => [
            assessment.competency,
            assessment.level
        ])
    );

    let exactMatches = 0;
    let absoluteErrorSum = 0;
    let comparedItems = 0;

    for (const assessment of actual) {
        const expectedLevel =
            expectedByCompetency.get(
                assessment.competency
            );

        if (expectedLevel === undefined) {
            continue;
        }

        comparedItems++;

        if (
            assessment.level === expectedLevel
        ) {
            exactMatches++;
        }

        absoluteErrorSum += Math.abs(
            assessment.level -
            expectedLevel
        );
    }

    return {
        total: comparedItems,
        exactMatches,
        exactMatchRate:
            comparedItems === 0
                ? 0
                : exactMatches /
                comparedItems,
        meanAbsoluteError:
            comparedItems === 0
                ? 0
                : absoluteErrorSum /
                comparedItems
    };
}

const caseIds = fs
    .readdirSync(CASES_DIR, {
        withFileTypes: true
    })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

console.log(
    "[Aggregation] Cases discovered:",
    caseIds
);

const caseSummaries: CaseSummary[] =
    caseIds.map((caseId) => {
        const baselinePath = path.join(
            RESULTS_DIR,
            "baseline",
            `${caseId}.json`
        );

        const midpathPath = path.join(
            RESULTS_DIR,
            "midpath",
            `${caseId}.json`
        );

        return {
            caseId,
            baselineAvailable:
                fs.existsSync(baselinePath),
            midpathAvailable:
                fs.existsSync(midpathPath)
        };
    });

console.table(caseSummaries);

const aggregatedResults: AggregatedCaseResult[] =
    caseSummaries.map((summary) => {
        const goldStandardPath = path.join(
            CASES_DIR,
            summary.caseId,
            "gold-standard.json"
        );

        const goldStandard =
            readJson<GoldStandard>(
                goldStandardPath
            );

        const normalizedGold =
            normalizeGoldStandard(
                goldStandard
            );

        const result: AggregatedCaseResult = {
            caseId: summary.caseId
        };

        if (summary.baselineAvailable) {
            const baselinePath = path.join(
                RESULTS_DIR,
                "baseline",
                `${summary.caseId}.json`
            );

            const baselineResult =
                readJson<BaselineResult>(
                    baselinePath
                );

            result.baseline =
                calculateCompetencyMetrics(
                    normalizeBaseline(
                        baselineResult
                    ),
                    normalizedGold
                );
        }

        if (summary.midpathAvailable) {
            const midpathPath = path.join(
                RESULTS_DIR,
                "midpath",
                `${summary.caseId}.json`
            );

            const midpathResult =
                readJson<MidPathResult>(
                    midpathPath
                );

            result.midpath =
                calculateCompetencyMetrics(
                    normalizeMidPath(
                        midpathResult
                    ),
                    normalizedGold
                );
        }

        return result;
    });

console.log(
    "[Aggregation] Aggregated results:"
);

console.dir(
    aggregatedResults,
    {
        depth: null
    }
);

console.log(
    "[Aggregation] Results directory:",
    RESULTS_DIR
);

console.log(
    "[Aggregation] Cases directory:",
    CASES_DIR
);