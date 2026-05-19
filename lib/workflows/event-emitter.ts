/**
 * Workflow Event Emitter
 * Handles real-time streaming of workflow events
 */

export interface WorkflowEvent {
  type: 
    | "workflow-start"
    | "workflow-complete"
    | "workflow-error"
    | "step-start"
    | "step-complete"
    | "step-skip"
    | "approval-needed"
    | "agent-log";
  workflowId?: string;
  stepId?: string;
  agentType?: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

type EventHandler = (event: WorkflowEvent) => void;

export class WorkflowEventEmitter {
  private handlers: Set<EventHandler> = new Set();
  private eventBuffer: WorkflowEvent[] = [];
  private maxBufferSize = 1000;

  /**
   * Subscribe to events
   */
  on(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Emit an event to all subscribers
   */
  emit(event: Omit<WorkflowEvent, "timestamp">): void {
    const fullEvent: WorkflowEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Add to buffer
    this.eventBuffer.push(fullEvent);
    if (this.eventBuffer.length > this.maxBufferSize) {
      this.eventBuffer.shift();
    }

    // Notify subscribers
    this.handlers.forEach(handler => {
      try {
        handler(fullEvent);
      } catch (err) {
        console.error("[WorkflowEventEmitter] Handler error:", err);
      }
    });
  }

  /**
   * Get recent events from buffer
   */
  getRecentEvents(limit = 100): WorkflowEvent[] {
    return this.eventBuffer.slice(-limit);
  }

  /**
   * Clear event buffer
   */
  clearBuffer(): void {
    this.eventBuffer = [];
  }
}

// Global event emitter instance for server-side use
export const globalWorkflowEmitter = new WorkflowEventEmitter();

/**
 * Create a new event emitter for a specific workflow
 */
export function createWorkflowEmitter(): WorkflowEventEmitter {
  return new WorkflowEventEmitter();
}
