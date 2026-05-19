/**
 * Unified AI Agents - Main Export
 * Central export point for all agent functionality
 * Agentic Career Architect Framework
 */

// Registry (NEW - Phase 1 Foundation)
export {
  AgentRegistry,
  getAgentConfig,
  shouldRequireReview,
  getModelForAgent,
  type AgentType,
  type AgentStatus,
  type ModelProvider,
  type AgentConfig,
} from "./registry";

// Groq-Only AI Client (30 RPM, no fallback)
export {
  callAI,
  callAIWithAgent,
  runAgentWithTools,
  parseJSONSafe,
  checkRateLimit,
  recordRequest,
  waitForRateLimit,
  type CallAIResult,
  type CallAIOptions,
  type ToolCall,
  type ToolResult,
  type ToolHandler,
} from "@/lib/ai/groq-client";

// Tools (NEW)
export {
  fetchResume,
  scoreResume,
  updateResumeSection,
  fetchJob,
  listJobs,
  savePendingChanges,
  applyChanges,
  ToolRegistry,
  type ToolName,
} from "./tools";

// Legacy Agents (will be phased out)
export { runJobMatchAgent, formatSkillGaps, generateMatchSummary } from "./job-match-agent";
export { runATSAgent, generateATSSummary, isATSReady, getKeywordCoverage } from "./ats-agent";
export { 
  runResumeAgent, 
  approveResumeChanges, 
  rejectResumeChanges, 
  formatResumeChanges 
} from "./resume-agent";

// Workflows
export { 
  runJobApplicationWorkflow, 
  getWorkflowStatus,
  type JobApplicationWorkflowInput 
} from "@/lib/workflows/job-application-workflow";
export { 
  WorkflowEventEmitter, 
  createWorkflowEmitter,
  globalWorkflowEmitter,
  type WorkflowEvent 
} from "@/lib/workflows/event-emitter";

// Memory
export {
  loadUserContext,
  getOrCreateMemory,
  initializeMemory,
  updateMemory,
  clearMemory,
  addAnalysisToMemory,
  getMemory,
  setWorkflowState,
  getWorkflowState,
  clearWorkflowState,
  type UserContext,
  type AgentMemory,
  type AnalysisRecord,
  type WorkflowState,
} from "@/lib/memory/shared-memory";

// Observability
export {
  agentLogger,
  emitAgentEvent,
  subscribeToAgentEvents,
  type AgentMetrics,
  type ToolCallMetrics,
  type LogEntry,
} from "@/lib/observability/logger";

// Guardrails
export {
  runResumeGuardrails,
  filterApprovedChanges,
  formatGuardrailReport,
  type GuardrailResult,
} from "@/lib/guardrails/resume-guardrails";

// Schemas
export {
  SkillGapSchema,
  JobMatchResultSchema,
  KeywordMatchSchema,
  ATSScoreResultSchema,
  ResumeChangeSchema,
  ResumeOptimizationResultSchema,
  WorkflowStepSchema,
  WorkflowResultSchema,
  AgentEventSchema,
  type SkillGap,
  type JobMatchResult,
  type KeywordMatch,
  type ATSScoreResult,
  type ResumeChange,
  type ResumeOptimizationResult,
  type WorkflowStep,
  type WorkflowResult,
  type AgentEvent,
} from "@/lib/schemas/agent-schemas";
