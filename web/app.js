const benchmarkCases = {
    "case-001": {
        id: "CASE 001",
        title: "Idempotency Reliability",
        description:
            "Sequential duplicate requests are handled, but the implementation does not demonstrate concurrency-safe idempotency.",

        status: "available",
        severity: "HIGH",

        competency: {
            name: "IDEMPOTENCY_RELIABILITY",
            level: 2,
            maxLevel: 3,
            justification:
                "Repeated sequential requests using an idempotency key are handled correctly by querying and returning stored records. However, stronger reliability guarantees are absent due to the lack of concurrency locking, payload consistency checks, and atomic persistence safeguards."
        },

        evidence: [
            {
                id: "E1",
                type: "implementation",
                critical: false,
                observation:
                    "PaymentService.createPayment validates input parameters and rejects missing idempotency keys, invalid amounts, and invalid currency length."
            },
            {
                id: "E2",
                type: "implementation",
                critical: false,
                observation:
                    "PaymentService normalizes the currency string to uppercase before creating the payment."
            },
            {
                id: "E3",
                type: "implementation",
                critical: false,
                observation:
                    "PaymentService queries the idempotency repository before payment creation and saves the idempotency record afterward."
            },
            {
                id: "E4",
                type: "test",
                critical: false,
                observation:
                    "Tests cover payment creation, sequential idempotency-key reuse, missing-key rejection, zero-amount rejection, and currency normalization."
            },
            {
                id: "E5",
                type: "missing",
                critical: true,
                observation:
                    "Payment creation and idempotency persistence are separate operations without transactional atomicity or rollback."
            },
            {
                id: "E6",
                type: "missing",
                critical: true,
                observation:
                    "Reusing an idempotency key does not verify whether amount and currency match the original request."
            },
            {
                id: "E7",
                type: "missing",
                critical: true,
                observation:
                    "No locking or concurrency-control mechanism prevents concurrent requests with the same idempotency key from creating duplicate payments."
            },
            {
                id: "E8",
                type: "missing",
                critical: false,
                observation:
                    "Tests do not cover invalid currency rejection, concurrent execution, or repository failure handling."
            }
        ],

        findings: [
            {
                severity: "HIGH",
                competency: "IDEMPOTENCY_RELIABILITY",
                title: "Concurrency Race Condition",
                summary:
                    "Lack of locking or concurrency control allows concurrent requests with the same idempotency key to execute duplicate payment creations.",
                evidenceIds: ["E7"]
            },
            {
                severity: "HIGH",
                competency: "PERSISTENCE",
                title: "Non-Atomic Persistence",
                summary:
                    "Payment creation and idempotency persistence are separate non-atomic operations, risking inconsistent state if persistence fails after payment creation.",
                evidenceIds: ["E5"]
            },
            {
                severity: "MEDIUM",
                competency: "REST_API",
                title: "Payload Consistency Not Verified",
                summary:
                    "Reusing an idempotency key with modified request parameters returns the original payment without validating payload consistency.",
                evidenceIds: ["E6"]
            }
        ],

        traceability: {
            score: "100%",
            label: "Resolvable Evidence",
            evidenceIds: ["E7"]
        }
    },

    "case-002": {
        id: "CASE 002",
        title: "Transaction Consistency",
        description:
            "Order creation performs multiple persistence operations successfully on the happy path, but does not preserve consistency when downstream operations fail.",

        status: "available",
        severity: "HIGH",

        competency: {
            name: "TRANSACTION_RELIABILITY",
            level: 1,
            maxLevel: 3,
            justification:
                "Related writes to order, inventory, and payment repositories execute independently without transaction safety, introducing a realistic risk of partial state if downstream writes fail."
        },

        evidence: [
            {
                id: "E1",
                type: "implementation",
                critical: false,
                observation:
                    "OrderService.createOrder validates customerId, productId, quantity, and amount before executing repository operations."
            },
            {
                id: "E2",
                type: "implementation",
                critical: true,
                observation:
                    "Order creation, inventory decrease, and payment-attempt creation execute sequentially as separate repository operations."
            },
            {
                id: "E3",
                type: "missing",
                critical: true,
                observation:
                    "No transaction wrapper, rollback, compensation, or recovery mechanism protects the sequence when a downstream operation fails."
            },
            {
                id: "E4",
                type: "test",
                critical: false,
                observation:
                    "Tests verify the expected repository call sequence under normal successful execution."
            },
            {
                id: "E5",
                type: "test",
                critical: false,
                observation:
                    "Tests cover common input-validation failures for customerId, productId, quantity, and amount."
            },
            {
                id: "E6",
                type: "missing",
                critical: true,
                observation:
                    "Tests do not cover partial failures, repository rejections, rollback behavior, or state cleanup."
            }
        ],

        findings: [
            {
                severity: "HIGH",
                competency: "TRANSACTION_RELIABILITY",
                title: "Partial Write Inconsistency",
                summary:
                    "Sequential independent repository calls have no transactional boundary or compensation logic, creating a high risk of partially persisted state.",
                evidenceIds: ["E2", "E3"]
            },
            {
                severity: "MEDIUM",
                competency: "TESTING",
                title: "Failure Modes Untested",
                summary:
                    "The test suite omits partial failures, repository errors, and rollback verification.",
                evidenceIds: ["E6"]
            }
        ],

        traceability: {
            score: "100%",
            label: "Resolvable Evidence",
            evidenceIds: ["E2", "E3"]
        }
    },

    "case-003": {
        id: "CASE 003",
        title: "Authorization Boundary",
        description:
            "The benchmark tests whether authentication is incorrectly treated as sufficient authorization for modifying another user's resource.",

        status: "unavailable",
        severity: "UNAVAILABLE",

        reason:
            "MidPath evaluation unavailable because the external Gemini free-tier request quota was exhausted during execution.",

        competency: {
            name: "AUTHORIZATION_RELIABILITY",
            level: null,
            maxLevel: 3,
            justification:
                "No MidPath result is reported for this case. The run was interrupted by an external provider quota limit and is intentionally not treated as a zero score."
        },

        evidence: [],

        findings: [],

        traceability: {
            score: "N/A",
            label: "Evaluation Unavailable",
            evidenceIds: []
        }
    }
};


/* =========================================================
   DOM REFERENCES
========================================================= */

const caseButtons = document.querySelectorAll(".case-button");

const caseTitle = document.getElementById("case-title");
const caseDescription = document.getElementById("case-description");
const caseSeverity = document.getElementById("case-severity");

const evidenceList = document.getElementById("evidence-list");

const competencyName = document.getElementById("competency-name");
const competencyLevel = document.getElementById("competency-level");
const competencyJustification =
    document.getElementById("competency-justification");

const findingTitle = document.getElementById("finding-title");
const findingBadge = document.getElementById("finding-badge");
const findingSummary = document.getElementById("finding-summary");

const traceabilityScore =
    document.getElementById("traceability-score");

const traceabilityPath =
    document.querySelector(".traceability-path");

const caseIdLabel =
    document.querySelector(".case-id");


/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function renderEvidence(caseData) {
    evidenceList.innerHTML = "";

    if (caseData.status === "unavailable") {
        evidenceList.innerHTML = `
      <div class="evidence-item critical">
        <span class="evidence-id">N/A</span>
        <p>
          ${escapeHtml(caseData.reason)}
        </p>
      </div>
    `;

        return;
    }

    caseData.evidence.forEach((evidence) => {
        const item = document.createElement("div");

        item.className =
            evidence.critical
                ? "evidence-item critical"
                : "evidence-item";

        item.innerHTML = `
      <span class="evidence-id">
        ${escapeHtml(evidence.id)}
      </span>

      <p>
        ${escapeHtml(evidence.observation)}
      </p>
    `;

        evidenceList.appendChild(item);
    });
}


function renderCompetency(caseData) {
    competencyName.textContent =
        caseData.competency.name;

    competencyLevel.textContent =
        caseData.competency.level === null
            ? "N/A"
            : caseData.competency.level;

    const levelSuffix =
        document.querySelector(".level-display span");

    levelSuffix.textContent =
        caseData.competency.level === null
            ? ""
            : `/ ${caseData.competency.maxLevel}`;

    competencyJustification.textContent =
        caseData.competency.justification;
}


function renderFinding(caseData) {
    if (
        caseData.status === "unavailable" ||
        caseData.findings.length === 0
    ) {
        findingTitle.textContent =
            "Evaluation Unavailable";

        findingBadge.textContent =
            "UNAVAILABLE";

        findingSummary.textContent =
            caseData.reason;

        return;
    }

    const primaryFinding =
        caseData.findings[0];

    findingTitle.textContent =
        primaryFinding.title;

    findingBadge.textContent =
        primaryFinding.severity;

    findingSummary.textContent =
        primaryFinding.summary;
}


function renderTraceability(caseData) {
    traceabilityScore.textContent =
        caseData.traceability.score;

    const scoreLabel =
        document.querySelector(
            ".traceability-score span"
        );

    scoreLabel.textContent =
        caseData.traceability.label;

    if (
        caseData.status === "unavailable" ||
        caseData.traceability.evidenceIds.length === 0
    ) {
        traceabilityPath.innerHTML = `
      <span>No verified MidPath trace available</span>
    `;

        return;
    }

    const evidenceNodes =
        caseData.traceability.evidenceIds
            .map((id) => `<span>${escapeHtml(id)}</span>`)
            .join(
                '<span>+</span>'
            );

    traceabilityPath.innerHTML = `
    ${evidenceNodes}
    <span>→</span>
    <span>Assessment</span>
    <span>→</span>
    <span>Finding</span>
  `;
}


function renderCase(caseKey) {
    const caseData =
        benchmarkCases[caseKey];

    if (!caseData) {
        return;
    }

    caseIdLabel.textContent =
        caseData.id;

    caseTitle.textContent =
        caseData.title;

    caseDescription.textContent =
        caseData.description;

    caseSeverity.textContent =
        caseData.severity;

    renderEvidence(caseData);
    renderCompetency(caseData);
    renderFinding(caseData);
    renderTraceability(caseData);
}


/* =========================================================
   CASE SELECTOR
========================================================= */

caseButtons.forEach((button) => {
    button.addEventListener(
        "click",
        () => {
            const caseKey =
                button.dataset.case;

            caseButtons.forEach(
                (currentButton) => {
                    currentButton.classList.remove(
                        "active"
                    );
                }
            );

            button.classList.add(
                "active"
            );

            renderCase(caseKey);
        }
    );
});


/* =========================================================
   NAVIGATION
========================================================= */

const navLinks =
    document.querySelectorAll(".nav-link");

navLinks.forEach((link) => {
    link.addEventListener(
        "click",
        () => {
            navLinks.forEach(
                (currentLink) => {
                    currentLink.classList.remove(
                        "active"
                    );
                }
            );

            link.classList.add(
                "active"
            );
        }
    );
});


/* =========================================================
   INITIAL STATE
========================================================= */

renderCase("case-001");