-- ============================================================
-- MidPath AI
-- Evidence Store Schema
--
-- Architecture:
-- Artifact -> Evidence -> Claim -> Competency Assessment
--          -> Intervention -> Verification -> Evidence Delta
-- ============================================================


-- ============================================================
-- 1. LEARNERS
-- ============================================================

CREATE TABLE learners (
    id SERIAL PRIMARY KEY,

    username VARCHAR(100) NOT NULL UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 2. COMPETENCY TAXONOMY
-- ============================================================

CREATE TABLE competencies (
    id SERIAL PRIMARY KEY,

    code VARCHAR(50) NOT NULL UNIQUE,

    name VARCHAR(120) NOT NULL,

    description TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 3. ASSESSMENTS
--
-- Represents one evaluation execution.
-- Baseline and MidPath runs must remain distinguishable.
-- ============================================================

CREATE TABLE assessments (
    id SERIAL PRIMARY KEY,

    learner_id INTEGER NOT NULL
        REFERENCES learners(id)
        ON DELETE CASCADE,

    assessment_type VARCHAR(30) NOT NULL
        CHECK (
            assessment_type IN (
                'baseline',
                'midpath',
                'verification'
            )
        ),

    evaluation_case_id VARCHAR(100),

    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'running',
                'completed',
                'failed'
            )
        ),

    model_name VARCHAR(120),

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    completed_at TIMESTAMPTZ
);


-- ============================================================
-- 4. ARTIFACTS
--
-- Concrete engineering artifacts analyzed during an assessment.
-- ============================================================

CREATE TABLE artifacts (
    id SERIAL PRIMARY KEY,

    assessment_id INTEGER NOT NULL
        REFERENCES assessments(id)
        ON DELETE CASCADE,

    artifact_type VARCHAR(50) NOT NULL
        CHECK (
            artifact_type IN (
                'source_code',
                'test',
                'api_contract',
                'database_schema',
                'architecture_document',
                'execution_result',
                'technical_reasoning',
                'other'
            )
        ),

    path VARCHAR(500) NOT NULL,

    content_hash VARCHAR(128),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 5. EVIDENCE
--
-- Atomic engineering observations extracted from artifacts.
-- ============================================================

CREATE TABLE evidence (
    id SERIAL PRIMARY KEY,

    assessment_id INTEGER NOT NULL
        REFERENCES assessments(id)
        ON DELETE CASCADE,

    artifact_id INTEGER NOT NULL
        REFERENCES artifacts(id)
        ON DELETE CASCADE,

    competency_id INTEGER NOT NULL
        REFERENCES competencies(id),

    location VARCHAR(255),

    observation TEXT NOT NULL,

    evidence_type VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 6. COMPETENCY CLAIMS
--
-- A probabilistic claim proposed by an LLM before validation.
--
-- This table represents the Evidence Contract.
-- ============================================================

CREATE TABLE competency_claims (
    id SERIAL PRIMARY KEY,

    assessment_id INTEGER NOT NULL
        REFERENCES assessments(id)
        ON DELETE CASCADE,

    competency_id INTEGER NOT NULL
        REFERENCES competencies(id),

    proposed_level SMALLINT NOT NULL
        CHECK (proposed_level BETWEEN 0 AND 3),

    confidence NUMERIC(4,3)
        CHECK (
            confidence IS NULL
            OR confidence BETWEEN 0 AND 1
        ),

    reasoning_summary TEXT NOT NULL,

    missing_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,

    gate_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (
            gate_status IN (
                'pending',
                'passed',
                'rejected'
            )
        ),

    rejection_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 7. CLAIM <-> EVIDENCE RELATIONSHIP
--
-- A claim may depend on multiple evidence records.
-- One evidence record may support multiple claims.
-- ============================================================

CREATE TABLE claim_evidence (
    claim_id INTEGER NOT NULL
        REFERENCES competency_claims(id)
        ON DELETE CASCADE,

    evidence_id INTEGER NOT NULL
        REFERENCES evidence(id)
        ON DELETE CASCADE,

    PRIMARY KEY (claim_id, evidence_id)
);


-- ============================================================
-- 8. COMPETENCY ASSESSMENTS
--
-- Final validated classification for a competency
-- within a specific assessment.
--
-- Gold Standard, baseline and MidPath use the same 0-3 scale.
-- ============================================================

CREATE TABLE competency_assessments (
    id SERIAL PRIMARY KEY,

    assessment_id INTEGER NOT NULL
        REFERENCES assessments(id)
        ON DELETE CASCADE,

    competency_id INTEGER NOT NULL
        REFERENCES competencies(id),

    level SMALLINT NOT NULL
        CHECK (level BETWEEN 0 AND 3),

    evidence_count INTEGER NOT NULL DEFAULT 0
        CHECK (evidence_count >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (assessment_id, competency_id)
);


-- ============================================================
-- 9. CURRENT COMPETENCY PROFILE
--
-- Projection of the learner's latest validated evidence.
--
-- This table is a materialized domain projection.
-- Historical data remains in competency_assessments.
-- ============================================================

CREATE TABLE competency_profiles (
    learner_id INTEGER NOT NULL
        REFERENCES learners(id)
        ON DELETE CASCADE,

    competency_id INTEGER NOT NULL
        REFERENCES competencies(id),

    current_level SMALLINT NOT NULL
        CHECK (current_level BETWEEN 0 AND 3),

    evidence_count INTEGER NOT NULL DEFAULT 0
        CHECK (evidence_count >= 0),

    source_assessment_id INTEGER
        REFERENCES assessments(id),

    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (learner_id, competency_id)
);


-- ============================================================
-- 10. INTERVENTIONS
--
-- Targeted micro-challenge generated to address
-- a validated competency gap.
-- ============================================================

CREATE TABLE interventions (
    id SERIAL PRIMARY KEY,

    learner_id INTEGER NOT NULL
        REFERENCES learners(id)
        ON DELETE CASCADE,

    source_assessment_id INTEGER NOT NULL
        REFERENCES assessments(id),

    competency_id INTEGER NOT NULL
        REFERENCES competencies(id),

    title VARCHAR(200) NOT NULL,

    description TEXT NOT NULL,

    expected_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,

    status VARCHAR(30) NOT NULL DEFAULT 'proposed'
        CHECK (
            status IN (
                'proposed',
                'accepted',
                'completed',
                'cancelled'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    completed_at TIMESTAMPTZ
);


-- ============================================================
-- 11. VERIFICATIONS
--
-- Links an intervention to the reassessment performed
-- after the learner submits new artifacts.
-- ============================================================

CREATE TABLE verifications (
    id SERIAL PRIMARY KEY,

    intervention_id INTEGER NOT NULL
        REFERENCES interventions(id)
        ON DELETE CASCADE,

    verification_assessment_id INTEGER NOT NULL
        REFERENCES assessments(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (intervention_id, verification_assessment_id)
);


-- ============================================================
-- 12. EVIDENCE DELTAS
--
-- Quantifies competency change after an intervention.
-- ============================================================

CREATE TABLE evidence_deltas (
    id SERIAL PRIMARY KEY,

    intervention_id INTEGER NOT NULL
        REFERENCES interventions(id)
        ON DELETE CASCADE,

    competency_id INTEGER NOT NULL
        REFERENCES competencies(id),

    previous_level SMALLINT NOT NULL
        CHECK (previous_level BETWEEN 0 AND 3),

    new_level SMALLINT NOT NULL
        CHECK (new_level BETWEEN 0 AND 3),

    delta SMALLINT GENERATED ALWAYS AS (
        new_level - previous_level
    ) STORED,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 13. INDEXES
-- ============================================================

CREATE INDEX idx_assessments_learner
    ON assessments(learner_id);

CREATE INDEX idx_artifacts_assessment
    ON artifacts(assessment_id);

CREATE INDEX idx_evidence_assessment
    ON evidence(assessment_id);

CREATE INDEX idx_evidence_competency
    ON evidence(competency_id);

CREATE INDEX idx_claims_assessment
    ON competency_claims(assessment_id);

CREATE INDEX idx_claims_gate_status
    ON competency_claims(gate_status);

CREATE INDEX idx_competency_assessments_assessment
    ON competency_assessments(assessment_id);

CREATE INDEX idx_interventions_learner
    ON interventions(learner_id);


-- ============================================================
-- 14. INITIAL COMPETENCY TAXONOMY
-- ============================================================

INSERT INTO competencies (
    code,
    name,
    description
)
VALUES
(
    'REST_API',
    'REST API Design & Contracts',
    'Ability to design consistent HTTP APIs using appropriate contracts, status codes and resource semantics.'
),
(
    'PERSISTENCE',
    'Data Persistence & Relational Modeling',
    'Ability to model and persist data using relational database principles and appropriate transactional behavior.'
),
(
    'TESTING',
    'Automated Testing',
    'Ability to create automated tests that validate expected behavior, failure scenarios and important edge cases.'
),
(
    'ERROR_HANDLING',
    'Error Handling',
    'Ability to detect, represent and handle application failures consistently and safely.'
),
(
    'IDEMPOTENCY_RELIABILITY',
    'Idempotency & Reliability',
    'Ability to design operations that behave safely under retries, duplicate requests and reliability-related failure conditions.'
);