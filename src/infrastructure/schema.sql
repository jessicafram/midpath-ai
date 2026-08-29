-- MidPath AI - Evidence Store Schema
-- Optimized for the Evidence-Driven Evaluation Architecture

-- 1. Competency Taxonomy
CREATE TABLE competencies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- 2. Student Profile (The "Sensor" for risk analysis)
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    current_risk_score FLOAT DEFAULT 0.0 -- 0.0 a 1.0 (The Temperature Sensor)
);

-- 3. Evidence Log (Traceability: Why did the agent give this score?)
CREATE TABLE evidence_log (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    competency_id INTEGER REFERENCES competencies(id),
    artifact_path VARCHAR(255), -- Reference to the student's code/artifact
    evidence_score FLOAT,       -- Quantitative score from Analyst Agent
    analysis_justification TEXT, -- The "Reasoning" behind the score
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Proficiency Profile (Longitudinal data)
CREATE TABLE competency_profiles (
    student_id INTEGER REFERENCES students(id),
    competency_id INTEGER REFERENCES competencies(id),
    proficiency_level FLOAT, -- 0.0 to 1.0
    evidence_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, competency_id)
);