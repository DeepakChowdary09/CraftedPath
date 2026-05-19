# Unified AI Agent System

A multi-agent orchestration system for career preparation with human-in-the-loop approvals, workflow pipelines, and real-time streaming.

## Architecture Overview

```
/lib
  /agents          - Core agent implementations
    job-match-agent.ts    - Analyzes resume vs job description
    ats-agent.ts          - ATS scoring and optimization
    resume-agent.ts       - Resume optimization with tools
  /workflows       - Workflow orchestration
    job-application-workflow.ts  - Main pipeline orchestrator
    event-emitter.ts             - Real-time event streaming
  /memory          - Shared context system
    shared-memory.ts  - User context and session memory
  /prompts         - Prompt management
    /job-match, /ats, /resume, /interview
  /guardrails      - Safety and validation
    resume-guardrails.ts  - Resume change validation
  /observability   - Logging and metrics
    logger.ts     - Agent activity logging
  /schemas         - Structured outputs (Zod)
    agent-schemas.ts  - All agent output schemas
  /tools           - Database-modifying tools
    resume-tools.ts   - Resume CRUD operations
/actions/agents    - Server Actions
  job-match.js      - Job match analysis actions
  ats-review.js     - ATS review actions
  resume-optimizer.js - Resume optimization actions
```

## Key Features

### 1. Multi-Agent Orchestration
- **Job Match Agent**: Calculates match score, identifies skill gaps
- **ATS Agent**: Scores ATS compatibility, keyword analysis
- **Resume Agent**: Proposes and applies optimizations

### 2. Workflow Pipeline
```
JD Upload → Job Match → ATS Review → Resume Optimization → Approval → Apply
```

### 3. Human-in-the-Loop
- All resume changes require user approval
- Selective change approval/rejection
- Pending changes stored in database

### 4. Real-Time Streaming
- Server-Sent Events (SSE) for live agent logs
- Terminal-style display of agent activity
- Event filtering by workflow/agent

### 5. Guardrail System
- Validates proposed resume changes
- Prevents fake/sensitive content
- Checks for reasonable metrics

## Usage

### Job Match Analysis
```javascript
import { runJobMatchAgent } from "@/lib/agents";

const result = await runJobMatchAgent({
  userId: "user-123",
  jobDescription: "...",
  resumeContent: "...",
});
```

### ATS Review
```javascript
import { runATSAgent } from "@/lib/agents";

const result = await runATSAgent({
  userId: "user-123",
  resumeContent: "...",
  jobDescription: "...",
});
```

### Resume Optimization
```javascript
import { runResumeAgent } from "@/lib/agents";

const result = await runResumeAgent({
  userId: "user-123",
  currentResume: "...",
  jobDescription: "...",
  atsFeedback: { score, missingKeywords, issues },
  jobMatchFeedback: { skillGaps, matchScore },
});

// Later, approve changes:
await approveResumeChanges(userId, pendingChangesId);
```

### Full Workflow
```javascript
import { runJobApplicationWorkflow } from "@/lib/agents";

const result = await runJobApplicationWorkflow({
  userId: "user-123",
  jobDescription: "...",
  resumeContent: "...",
  options: {
    skipResumeOptimization: false,
    autoApplyChanges: false,
    minMatchScore: 50,
    minATSScore: 60,
  },
});
```

## Database Migration

Run the migration to add the PendingChanges table:

```bash
npx prisma migrate dev --name add_pending_changes
```

## API Routes

- `GET /api/streaming` - SSE endpoint for real-time agent events

## Pages

- `/job-match` - Job match analysis
- `/ats-review` - ATS compatibility check
- `/resume-optimizer` - Resume optimization with approvals
- `/workflow` - Full workflow pipeline

## Environment Variables

Required AI providers:
- `GEMINI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY`
- `GROQ_API_KEY`

## Observability

All agent runs are logged to the `AgentRun` table with:
- Agent type
- Status (completed/failed)
- Duration
- Tool call log
- Input/output summaries

View agent activity in real-time via the terminal display on any agent page.
