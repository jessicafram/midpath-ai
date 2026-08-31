# MidPath AI — Representative Agent Trajectories

This document records representative execution trajectories for the specialized agents used by MidPath AI.

The purpose is to make the agentic workflow inspectable from input artifacts through evidence extraction, competency mapping, verification, and final evaluation.

These trajectories describe implemented benchmark executions and their frozen results. They are not hypothetical demonstrations.

---

## 1. Workflow Overview

MidPath uses three specialized stages:

1. **Evidence Analyst**
   - Reads engineering artifacts.
   - Extracts concrete, source-linked evidence.
   - Assigns stable evidence identifiers.

2. **Competency Mapper**
   - Receives the extracted evidence.
   - Maps that evidence to rubric competencies.
   - Produces competency assessments and critical findings.

3. **Verification Agent**
   - Receives assessments, findings, and evidence references.
   - Checks whether assessment claims are supported by the available evidence.
   - Produces the final verified assessment.

The execution path is:

```text
Engineering Artifacts
        |
        v
Evidence Analyst
        |
        | structured evidence E1...En
        v
Competency Mapper
        |
        | competency assessments
        | critical findings
        | evidence references
        v
Verification Agent
        |
        v
Verified Assessment