export interface CompetencyScore {
    competency: string;
    expectedLevel: number;
    actualLevel: number;
    exactMatch: boolean;
    absoluteError: number;
}

export interface ScoreSummary {
    totalCompetencies: number;
    exactMatches: number;
    exactMatchRate: number;
    meanAbsoluteError: number;
    competencyScores: CompetencyScore[];
}

export interface ExpectedCriticalFinding {
    competency: string;
    severity: string;
}

export interface ActualCriticalFinding {
    competency: string;
    severity: string;
    summary: string;
}

export interface CriticalFindingScore {
    expectedCompetency: string;
    expectedSeverity: string;
    competencyDetected: boolean;
    severityMatched: boolean;
    detected: boolean;
}

export function scoreCompetencies(
    expected: Record<string, number>,
    actual: Record<string, number>
): ScoreSummary {
    const competencies = Object.keys(expected);

    const competencyScores = competencies.map(
        (competency): CompetencyScore => {
            const expectedLevel = expected[competency];
            const actualLevel = actual[competency];

            if (
                expectedLevel === undefined ||
                actualLevel === undefined
            ) {
                throw new Error(
                    `Missing competency score: ${competency}`
                );
            }

            const absoluteError = Math.abs(
                expectedLevel - actualLevel
            );

            return {
                competency,
                expectedLevel,
                actualLevel,
                exactMatch:
                    expectedLevel === actualLevel,
                absoluteError
            };
        }
    );

    const exactMatches =
        competencyScores.filter(
            (score) => score.exactMatch
        ).length;

    const totalAbsoluteError =
        competencyScores.reduce(
            (sum, score) =>
                sum + score.absoluteError,
            0
        );

    return {
        totalCompetencies:
            competencyScores.length,
        exactMatches,
        exactMatchRate:
            competencyScores.length === 0
                ? 0
                : exactMatches /
                competencyScores.length,
        meanAbsoluteError:
            competencyScores.length === 0
                ? 0
                : totalAbsoluteError /
                competencyScores.length,
        competencyScores
    };
}
export function scoreCriticalFinding(
    expected: ExpectedCriticalFinding,
    actual: ActualCriticalFinding[]
): CriticalFindingScore {
    const competencyMatch = actual.find(
        (finding) =>
            finding.competency ===
            expected.competency
    );

    if (!competencyMatch) {
        return {
            expectedCompetency:
                expected.competency,
            expectedSeverity:
                expected.severity,
            competencyDetected: false,
            severityMatched: false,
            detected: false
        };
    }

    const severityMatched =
        competencyMatch.severity ===
        expected.severity;

    return {
        expectedCompetency:
            expected.competency,
        expectedSeverity:
            expected.severity,
        competencyDetected: true,
        severityMatched,
        detected: severityMatched
    };
}