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
    critical_findings: Array<{
        severity: string;
        competency: string;
        summary: string;
        evidence: unknown[];
    }>;
}

interface MidPathResult {
    caseId: string;
    workflow: {
        evidenceAnalysis: {
            evidence: Array<{
                id: string;
                artifact: string;
                observation: string;
                evidenceType: string;
                confidence: number;
            }>;
        };
        competencyMapping: {
            assessments: Array<{
                competency: string;
                level: number;
                evidenceIds?: string[];
            }>;
        };
        verification: {
            criticalFindings: Array<{
                severity: string;
                competency: string;
                summary: string;
                evidenceIds: string[];
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

    baseline?: {
        competency: CompetencyMetrics;
        criticalFinding: CriticalFindingMetrics;
    };

    midpath?: {
        competency: CompetencyMetrics;
        criticalFinding: CriticalFindingMetrics;
        traceability: {
            assessments: TraceabilityMetrics;
            criticalFindings: TraceabilityMetrics;
        };
    };
}

interface CriticalFindingMetrics {
    detected: boolean;
    severityMatched: boolean;
}

interface TraceabilityMetrics {
    totalItems: number;
    traceableItems: number;
    coverage: number;
}

function normalizeMidPathCriticalFindings(
    result: MidPathResult
): NormalizedCriticalFinding[] {
    return result.workflow.verification.criticalFindings.map(
        (finding) => ({
            competency: finding.competency,
            severity: finding.severity
        })
    );
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

function normalizeBaselineCriticalFindings(
    result: BaselineResult
): NormalizedCriticalFinding[] {
    return result.critical_findings.map(
        (finding) => ({
            competency: finding.competency,
            severity: finding.severity
        })
    );
}

function calculateCriticalFindingMetrics(
    actual: NormalizedCriticalFinding[],
    expected: NormalizedCriticalFinding
): CriticalFindingMetrics {
    const matchingFinding = actual.find(
        (finding) =>
            finding.competency ===
            expected.competency
    );

    if (!matchingFinding) {
        return {
            detected: false,
            severityMatched: false
        };
    }

    return {
        detected: true,
        severityMatched:
            matchingFinding.severity ===
            expected.severity
    };
}

function calculateTraceabilityMetrics(
    items: Array<{
        evidenceIds?: string[];
    }>,
    validEvidenceIds: Set<string>
): TraceabilityMetrics {
    const traceableItems = items.filter(
        (item) => {
            const evidenceIds =
                item.evidenceIds ?? [];

            if (evidenceIds.length === 0) {
                return false;
            }

            return evidenceIds.some(
                (evidenceId) =>
                    validEvidenceIds.has(
                        evidenceId
                    )
            );
        }
    ).length;

    return {
        totalItems: items.length,
        traceableItems,
        coverage:
            items.length === 0
                ? 0
                : traceableItems /
                items.length
    };
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

            const normalizedBaseline =
                normalizeBaseline(
                    baselineResult
                );

            const normalizedBaselineFindings =
                normalizeBaselineCriticalFindings(
                    baselineResult
                );

            result.baseline = {
                competency:
                    calculateCompetencyMetrics(
                        normalizedBaseline,
                        normalizedGold
                    ),
                criticalFinding:
                    calculateCriticalFindingMetrics(
                        normalizedBaselineFindings,
                        {
                            competency:
                                goldStandard
                                    .critical_finding
                                    .competency,
                            severity:
                                goldStandard
                                    .critical_finding
                                    .severity
                        }
                    )
            };
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

            const normalizedMidPath =
                normalizeMidPath(
                    midpathResult
                );

            const normalizedMidPathFindings =
                normalizeMidPathCriticalFindings(
                    midpathResult
                );

            const validEvidenceIds = new Set(
                midpathResult.workflow.evidenceAnalysis.evidence.map(
                    (evidence) => evidence.id
                )
            );

            result.midpath = {
                competency:
                    calculateCompetencyMetrics(
                        normalizedMidPath,
                        normalizedGold
                    ),

                criticalFinding:
                    calculateCriticalFindingMetrics(
                        normalizedMidPathFindings,
                        {
                            competency:
                                goldStandard
                                    .critical_finding
                                    .competency,
                            severity:
                                goldStandard
                                    .critical_finding
                                    .severity
                        }
                    ),

                traceability: {
                    assessments:
                        calculateTraceabilityMetrics(
                            midpathResult.workflow
                                .competencyMapping
                                .assessments,
                            validEvidenceIds
                        ),

                    criticalFindings:
                        calculateTraceabilityMetrics(
                            midpathResult.workflow
                                .verification
                                .criticalFindings,
                            validEvidenceIds
                        )
                }
            };
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