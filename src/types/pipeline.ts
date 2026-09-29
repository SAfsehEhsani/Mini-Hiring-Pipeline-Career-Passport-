/**
 * Core Domain Models and State Machine Definitions for Mini Hiring Pipeline
 */

export type PipelineStage = 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired';
export type TerminalStage = 'Hired' | 'Rejected';
export type CandidateStatus = 'ACTIVE' | 'HIRED' | 'REJECTED';

export const PIPELINE_STAGES: readonly PipelineStage[] = [
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Hired',
] as const;

/**
 * Sequential progression order. Skipping stages is strictly forbidden.
 */
export const STAGE_PROGRESSION_ORDER: Record<PipelineStage, PipelineStage | null> = {
  Applied: 'Screening',
  Screening: 'Interview',
  Interview: 'Offer',
  Offer: 'Hired',
  Hired: null, // Terminal state
};

export type AuditActionType =
  | 'CANDIDATE_CREATED'
  | 'STAGE_TRANSITION'
  | 'CANDIDATE_REJECTED'
  | 'NOTE_RECORDED';

/**
 * Immutable Audit Trail Entry.
 * Once created and appended, it cannot be modified or deleted.
 */
export interface AuditEntry {
  readonly id: string;
  readonly candidateId: string;
  readonly timestamp: string; // ISO 8601 string
  readonly action: AuditActionType;
  readonly fromStage?: PipelineStage | null;
  readonly toStage: PipelineStage | 'Rejected';
  readonly actor: string; // Recruiter name/ID
  readonly reason?: string;
  readonly immutableSignature: string; // Tamper-evident cryptographic signature
}

/**
 * Candidate Model
 */
export interface Candidate {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly role: string;
  readonly currentStage: PipelineStage | 'Rejected';
  readonly status: CandidateStatus;
  readonly createdAt: string; // ISO 8601
  readonly stageEnteredAt: string; // Timestamp when current stage was entered
  readonly auditTrail: readonly AuditEntry[]; // Append-only audit history
  readonly notes?: string;
  readonly tags?: readonly string[];
}

/**
 * Pipeline State Machine validation and transition logic
 */
export class PipelineStateMachine {
  /**
   * Returns next valid stage or null if terminal/invalid.
   */
  static getNextStage(currentStage: PipelineStage | 'Rejected'): PipelineStage | null {
    if (currentStage === 'Rejected' || currentStage === 'Hired') {
      return null;
    }
    return STAGE_PROGRESSION_ORDER[currentStage] ?? null;
  }

  /**
   * Evaluates if a candidate can advance to the next stage.
   * Skipping stages or moving backwards is not allowed.
   */
  static canAdvance(candidate: Candidate): { allowed: boolean; reason?: string; nextStage?: PipelineStage } {
    if (candidate.status === 'HIRED') {
      return { allowed: false, reason: 'Candidate is already Hired. Final outcomes cannot be altered.' };
    }
    if (candidate.status === 'REJECTED' || candidate.currentStage === 'Rejected') {
      return { allowed: false, reason: 'Candidate was Rejected. Final outcomes cannot be reversed.' };
    }

    const nextStage = this.getNextStage(candidate.currentStage as PipelineStage);
    if (!nextStage) {
      return { allowed: false, reason: `No further stages available from ${candidate.currentStage}.` };
    }

    return { allowed: true, nextStage };
  }

  /**
   * Evaluates if a candidate can be rejected.
   * Can be rejected at any point BEFORE being hired.
   */
  static canReject(candidate: Candidate): { allowed: boolean; reason?: string } {
    if (candidate.status === 'HIRED' || candidate.currentStage === 'Hired') {
      return { allowed: false, reason: 'Candidate is already Hired and cannot be rejected.' };
    }
    if (candidate.status === 'REJECTED' || candidate.currentStage === 'Rejected') {
      return { allowed: false, reason: 'Candidate is already in Rejected status.' };
    }
    return { allowed: true };
  }
}

/**
 * Parsed Intent from the Single Search Box
 */
export interface ParsedSearchQuery {
  rawQuery: string;
  hasFilters: boolean;
  filters: {
    nameQuery?: string;
    fuzzyNameMatch?: boolean;
    stage?: PipelineStage | 'Rejected';
    stuckInStage?: {
      stage: PipelineStage;
      minDays: number;
    };
    movedToStageSince?: {
      stage: PipelineStage;
      sinceDate: Date;
      sinceDescription: string;
    };
    reachedStageNotHired?: {
      reachedStage: PipelineStage;
    };
    excludeRejected?: boolean;
    excludeStages?: (PipelineStage | 'Rejected')[];
  };
  explanation: {
    summary: string;
    detectedIntents: string[];
    unrecognizedTokens: string[];
    suggestions: string[];
  };
}

/**
 * Scored Search Result for ranking
 */
export interface ScoredCandidate {
  candidate: Candidate;
  score: number;
  matchReasons: string[];
  isMatch: boolean;
}
