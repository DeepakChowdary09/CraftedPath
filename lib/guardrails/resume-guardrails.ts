/**
 * Guardrail Layer for Resume Agent
 * Ensures resume changes are safe, truthful, and appropriate
 */

import type { ResumeChange } from "@/lib/schemas/agent-schemas";

export interface GuardrailResult {
  approved: boolean;
  rejected: ResumeChange[];
  modified: ResumeChange[];
  warnings: string[];
  errors: string[];
}

// ============================================================================
// GUARDRAIL RULES
// ============================================================================

const FORBIDDEN_PATTERNS = [
  /fake\s+(?:company|experience|project)/i,
  /made\s+up\s+(?:data|numbers|metrics)/i,
  /lied\s+about/i,
  /\b(?!\w*\d{4}\b)\d{3,}\b/g, // Large numbers without context (potential fabrication)
];

const SENSITIVE_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
  /password/i,
  /api[_-]?key/i,
];

const UNPROFESSIONAL_PATTERNS = [
  /\b(dumb|stupid|idiot|hate)\b/i,
  /!!+/,
  /\?\?+/,
  /\b(lol|omg|wtf)\b/i,
];

// Maximum reasonable metrics
const MAX_METRICS = {
  percentage: 500, // Max 500% improvement
  revenue: 1000000000, // $1B max
  users: 10000000, // 10M users max
  teamSize: 1000, // 1000 people max
  timeReduction: 99, // 99% max
};

// ============================================================================
// GUARDRAIL FUNCTIONS
// ============================================================================

export function runResumeGuardrails(changes: ResumeChange[]): GuardrailResult {
  const result: GuardrailResult = {
    approved: true,
    rejected: [],
    modified: [],
    warnings: [],
    errors: [],
  };

  for (const change of changes) {
    const checkResult = checkChange(change);
    
    if (checkResult.severity === "error") {
      result.rejected.push(change);
      result.errors.push(checkResult.message);
      result.approved = false;
    } else if (checkResult.severity === "warning") {
      result.warnings.push(checkResult.message);
      // Apply modifications if suggested
      if (checkResult.modifiedChange) {
        result.modified.push(checkResult.modifiedChange);
      }
    }
  }

  // If we modified changes, update the approved status
  if (result.rejected.length > 0) {
    result.approved = false;
  }

  return result;
}

function checkChange(change: ResumeChange): {
  severity: "ok" | "warning" | "error";
  message: string;
  modifiedChange?: ResumeChange;
} {
  const content = change.proposedContent;

  // Check 1: No sensitive information
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(content)) {
      return {
        severity: "error",
        message: `Change ${change.id} contains sensitive information (SSN, credit card, password, etc.)`,
      };
    }
  }

  // Check 2: No fake/fabricated content indicators
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      return {
        severity: "error",
        message: `Change ${change.id} may contain fabricated content`,
      };
    }
  }

  // Check 3: Professional language
  for (const pattern of UNPROFESSIONAL_PATTERNS) {
    if (pattern.test(content)) {
      return {
        severity: "warning",
        message: `Change ${change.id} contains potentially unprofessional language`,
      };
    }
  }

  // Check 4: Reasonable metrics validation
  const metricCheck = validateMetrics(content);
  if (metricCheck.hasUnreasonableMetrics) {
    return {
      severity: "warning",
      message: `Change ${change.id} contains metrics that may be inflated: ${metricCheck.concerns.join(", ")}`,
    };
  }

  // Check 5: Length validation
  if (content.length > 2000) {
    return {
      severity: "warning",
      message: `Change ${change.id} is very long (${content.length} chars). Consider making it more concise.`,
    };
  }

  // Check 6: Section-specific validation
  const sectionCheck = validateSectionSpecific(change);
  if (sectionCheck.hasIssues) {
    return {
      severity: sectionCheck.severity,
      message: sectionCheck.message,
      modifiedChange: sectionCheck.modifiedChange,
    };
  }

  return { severity: "ok", message: "Change approved" };
}

function validateMetrics(content: string): {
  hasUnreasonableMetrics: boolean;
  concerns: string[];
} {
  const concerns: string[] = [];
  
  // Look for percentage claims
  const percentMatches = content.match(/(\d+)%/g);
  if (percentMatches) {
    for (const match of percentMatches) {
      const value = parseInt(match);
      if (value > MAX_METRICS.percentage) {
        concerns.push(`Percentage ${match} seems unrealistic`);
      }
    }
  }

  // Look for large numbers
  const largeNumberMatches = content.match(/\$?\d{7,}/g);
  if (largeNumberMatches) {
    for (const match of largeNumberMatches) {
      const value = parseInt(match.replace(/\$/, ""));
      if (value > MAX_METRICS.revenue) {
        concerns.push(`Revenue figure ${match} may be inflated`);
      }
    }
  }

  return {
    hasUnreasonableMetrics: concerns.length > 0,
    concerns,
  };
}

function validateSectionSpecific(change: ResumeChange): {
  hasIssues: boolean;
  severity: "ok" | "warning" | "error";
  message: string;
  modifiedChange?: ResumeChange;
} {
  const { section, proposedContent } = change;

  // Summary section checks
  if (section === "summary") {
    if (proposedContent.length > 500) {
      return {
        hasIssues: true,
        severity: "warning",
        message: "Professional summary is too long (max 500 chars recommended)",
        modifiedChange: {
          ...change,
          proposedContent: proposedContent.slice(0, 500) + "...",
        },
      };
    }
  }

  // Skills section checks
  if (section === "skills") {
    const skillCount = proposedContent.split(/,|;/).length;
    if (skillCount > 50) {
      return {
        hasIssues: true,
        severity: "warning",
        message: `Too many skills listed (${skillCount}). Focus on 15-20 most relevant.`,
      };
    }
  }

  // Experience section checks
  if (section === "experience") {
    // Check for quantified achievements
    if (!/\d+%|\$\d+|\d+\s*(?:users|customers|team|people)/i.test(proposedContent)) {
      return {
        hasIssues: true,
        severity: "warning",
        message: "Experience entry lacks quantifiable achievements. Consider adding metrics.",
      };
    }
  }

  return { hasIssues: false, severity: "ok", message: "" };
}

// ============================================================================
// BATCH GUARDRAIL PROCESSING
// ============================================================================

export function filterApprovedChanges(
  changes: ResumeChange[],
  guardrailResult: GuardrailResult
): ResumeChange[] {
  const rejectedIds = new Set(guardrailResult.rejected.map(c => c.id));
  const modifiedMap = new Map(guardrailResult.modified.map(c => [c.id, c]));

  return changes
    .filter(c => !rejectedIds.has(c.id))
    .map(c => modifiedMap.get(c.id) || c);
}

export function formatGuardrailReport(result: GuardrailResult): string {
  const lines: string[] = [];

  if (result.approved && result.warnings.length === 0) {
    return "✅ All changes passed guardrail checks.";
  }

  if (result.approved && result.warnings.length > 0) {
    lines.push("⚠️ Changes approved with warnings:");
    result.warnings.forEach(w => lines.push(`  - ${w}`));
  }

  if (!result.approved) {
    lines.push("❌ Some changes failed guardrail checks:");
    result.errors.forEach(e => lines.push(`  - ${e}`));
    lines.push(`\nRejected ${result.rejected.length} change(s).`);
  }

  if (result.modified.length > 0) {
    lines.push(`\n📝 Auto-modified ${result.modified.length} change(s) for compliance.`);
  }

  return lines.join("\n");
}
