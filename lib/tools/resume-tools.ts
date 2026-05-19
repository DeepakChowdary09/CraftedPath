/**
 * Resume Tools
 * Database-modifying tools for the Resume Agent
 */

import { db as prisma } from "@/lib/prisma";
import type { ResumeChange } from "@/lib/schemas/agent-schemas";

// ============================================================================
// TYPES
// ============================================================================

export interface PendingChangeSet {
  id: string;
  userId: string;
  changes: ResumeChange[];
  metadata: {
    source: string;
    workflowId?: string;
    atsScore?: number;
    matchScore?: number;
    createdAt?: Date;
  };
  status: "pending" | "approved" | "rejected" | "partially_approved";
}

// ============================================================================
// IN-MEMORY STORE (will be backed by database)
// ============================================================================

const pendingChangesStore = new Map<string, PendingChangeSet>();

// ============================================================================
// PENDING CHANGES MANAGEMENT
// ============================================================================

/**
 * Save proposed changes for human approval
 */
export async function savePendingChanges(
  userId: string,
  changes: ResumeChange[],
  metadata: PendingChangeSet["metadata"]
): Promise<string> {
  const id = crypto.randomUUID();
  
  const changeSet: PendingChangeSet = {
    id,
    userId,
    changes,
    metadata: {
      ...metadata,
      createdAt: new Date(),
    },
    status: "pending",
  };

  // Store in memory (will be persisted to DB)
  pendingChangesStore.set(id, changeSet);

  // TODO: Persist to database using PendingChanges model
  // await prisma.pendingChanges.create({
  //   data: {
  //     id,
  //     userId,
  //     changes: changes as any,
  //     metadata: metadata as any,
  //     status: "pending",
  //   },
  // });

  console.log(`[ResumeTools] Saved pending changes ${id} for user ${userId}: ${changes.length} changes`);

  return id;
}

/**
 * Get pending changes by ID
 */
export async function getPendingChanges(pendingChangesId: string): Promise<PendingChangeSet | null> {
  // Check memory first
  const fromMemory = pendingChangesStore.get(pendingChangesId);
  if (fromMemory) {
    return fromMemory;
  }

  // TODO: Fetch from database
  // const fromDb = await prisma.pendingChanges.findUnique({
  //   where: { id: pendingChangesId },
  // });
  // return fromDb;

  return null;
}

/**
 * Get all pending changes for a user
 */
export async function getUserPendingChanges(userId: string): Promise<PendingChangeSet[]> {
  const allChanges: PendingChangeSet[] = [];
  
  for (const changeSet of pendingChangesStore.values()) {
    if (changeSet.userId === userId && changeSet.status === "pending") {
      allChanges.push(changeSet);
    }
  }

  return allChanges.sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime());
}

/**
 * Discard/reject pending changes
 */
export async function discardPendingChanges(userId: string, pendingChangesId: string): Promise<void> {
  const changeSet = pendingChangesStore.get(pendingChangesId);
  
  if (!changeSet) {
    throw new Error(`Pending changes not found: ${pendingChangesId}`);
  }

  if (changeSet.userId !== userId) {
    throw new Error("Unauthorized: Cannot discard changes for another user");
  }

  changeSet.status = "rejected";
  
  // TODO: Update in database
  // await prisma.pendingChanges.update({
  //   where: { id: pendingChangesId },
  //   data: { status: "rejected" },
  // });

  console.log(`[ResumeTools] Discarded pending changes ${pendingChangesId}`);
}

// ============================================================================
// RESUME MODIFICATION TOOLS
// ============================================================================

/**
 * Apply changes to resume - THE CORE TOOL
 * This actually modifies the database
 */
export async function applyChangesToResume(
  userId: string,
  changes: ResumeChange[],
  pendingChangesId?: string,
  approvedChangeIds?: string[]
): Promise<ResumeChange[]> {
  console.log(`[ResumeTools] Applying changes for user ${userId}`);

  // If pendingChangesId is provided, load from there
  if (pendingChangesId) {
    const changeSet = pendingChangesStore.get(pendingChangesId);
    if (!changeSet) {
      throw new Error(`Pending changes not found: ${pendingChangesId}`);
    }
    if (changeSet.userId !== userId) {
      throw new Error("Unauthorized: Cannot apply changes for another user");
    }

    // Filter to only approved changes if specified
    if (approvedChangeIds && approvedChangeIds.length > 0) {
      changes = changeSet.changes.filter(c => approvedChangeIds.includes(c.id));
      changeSet.status = "partially_approved";
    } else {
      changes = changeSet.changes;
      changeSet.status = "approved";
    }
  }

  // Get current resume
  const currentResume = await prisma.resume.findUnique({
    where: { userId },
  });

  if (!currentResume) {
    throw new Error("No resume found for user");
  }

  // Apply each change
  let updatedContent = currentResume.content;
  const appliedChanges: ResumeChange[] = [];

  for (const change of changes) {
    try {
      updatedContent = applySingleChange(updatedContent, change);
      appliedChanges.push(change);
      console.log(`[ResumeTools] Applied change ${change.id}: ${change.section}.${change.changeType}`);
    } catch (err) {
      console.error(`[ResumeTools] Failed to apply change ${change.id}:`, err);
      // Continue with other changes
    }
  }

  // Save updated resume
  await prisma.resume.update({
    where: { userId },
    data: {
      content: updatedContent,
      updatedAt: new Date(),
    },
  });

  // Also create a new resume version
  await prisma.resumeVersion.create({
    data: {
      userId,
      title: `AI-Optimized ${new Date().toLocaleDateString()}`,
      content: updatedContent,
      tag: "ai-optimized",
      isActive: false, // Don't auto-activate, let user choose
    },
  });

  console.log(`[ResumeTools] Applied ${appliedChanges.length} changes and created new version`);

  return appliedChanges;
}

/**
 * Apply a single change to resume content
 * This is a simplified implementation - in production, you'd want more sophisticated parsing
 */
function applySingleChange(content: string, change: ResumeChange): string {
  const { section, changeType, currentContent, proposedContent, subsection } = change;

  switch (changeType) {
    case "add":
      return addContent(content, section, proposedContent, subsection);
    
    case "edit":
      if (!currentContent) {
        throw new Error("Edit change requires currentContent");
      }
      return editContent(content, currentContent, proposedContent);
    
    case "remove":
      if (!currentContent) {
        throw new Error("Remove change requires currentContent");
      }
      return removeContent(content, currentContent);
    
    case "reorder":
      // Reordering is complex - for now, we'll just append a note
      return content + `\n\n[Note: Reordering suggested for ${section}]\n`;
    
    default:
      throw new Error(`Unknown change type: ${changeType}`);
  }
}

function addContent(content: string, section: string, newContent: string, subsection?: string): string {
  // Simple implementation: append to end of content with a section header
  // In production, you'd parse the resume structure more intelligently
  
  const sectionHeader = subsection 
    ? `## ${section} - ${subsection}` 
    : `## ${section}`;
  
  return content + `\n\n${sectionHeader}\n${newContent}\n`;
}

function editContent(content: string, oldContent: string, newContent: string): string {
  // Simple find and replace
  // In production, you'd want fuzzy matching and better context handling
  
  if (!content.includes(oldContent)) {
    // Try with trimmed version
    const trimmedOld = oldContent.trim();
    if (content.includes(trimmedOld)) {
      return content.replace(trimmedOld, newContent);
    }
    throw new Error(`Could not find content to edit: ${oldContent.slice(0, 50)}...`);
  }
  
  return content.replace(oldContent, newContent);
}

function removeContent(content: string, contentToRemove: string): string {
  if (!content.includes(contentToRemove)) {
    const trimmedRemove = contentToRemove.trim();
    if (content.includes(trimmedRemove)) {
      return content.replace(trimmedRemove, "");
    }
    throw new Error(`Could not find content to remove: ${contentToRemove.slice(0, 50)}...`);
  }
  
  return content.replace(contentToRemove, "");
}

// ============================================================================
// UTILITY TOOLS
// ============================================================================

/**
 * Update a specific resume section
 * Direct tool for agents to use
 */
export async function updateResumeSection(
  userId: string,
  section: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resume = await prisma.resume.findUnique({
      where: { userId },
    });

    if (!resume) {
      return { success: false, error: "Resume not found" };
    }

    // Simple implementation: append section to content
    const updatedContent = resume.content + `\n\n## ${section}\n${content}\n`;

    await prisma.resume.update({
      where: { userId },
      data: {
        content: updatedContent,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Create a new resume version
 */
export async function createResumeVersion(
  userId: string,
  title: string,
  content: string,
  tag?: string
): Promise<{ success: boolean; versionId?: string; error?: string }> {
  try {
    const version = await prisma.resumeVersion.create({
      data: {
        userId,
        title,
        content,
        tag,
        isActive: false,
      },
    });

    return { success: true, versionId: version.id };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Get resume content for a user
 */
export async function getResumeContent(userId: string): Promise<string | null> {
  const resume = await prisma.resume.findUnique({
    where: { userId },
  });

  return resume?.content || null;
}
