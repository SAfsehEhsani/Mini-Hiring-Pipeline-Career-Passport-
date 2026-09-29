import React from 'react';
import { Clock, AlertTriangle, ArrowRight, Ban, CheckCircle, ShieldCheck } from 'lucide-react';
import type { Candidate } from '../types/pipeline';
import { PipelineStateMachine } from '../types/pipeline';
import { getStageDuration } from '../utils/time';

interface CandidateCardProps {
  candidate: Candidate;
  matchReasons?: string[];
  onSelect: (candidate: Candidate) => void;
  onAdvance: (candidate: Candidate, e: React.MouseEvent) => void;
  onReject: (candidate: Candidate, e: React.MouseEvent) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  matchReasons,
  onSelect,
  onAdvance,
  onReject,
}) => {
  const duration = getStageDuration(candidate.stageEnteredAt);
  const { allowed: canAdvance, nextStage } = PipelineStateMachine.canAdvance(candidate);
  const { allowed: canReject } = PipelineStateMachine.canReject(candidate);

  // Avatar initials
  const initials = candidate.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const isHired = candidate.status === 'HIRED';
  const isRejected = candidate.status === 'REJECTED';

  let statusClass = '';
  if (isHired) statusClass = 'is-hired';
  else if (isRejected) statusClass = 'is-rejected';
  else if (duration.isStalled) statusClass = 'is-stalled';

  return (
    <div
      className={`candidate-card ${statusClass}`}
      onClick={() => onSelect(candidate)}
      tabIndex={0}
      role="button"
      aria-label={`View audit history for ${candidate.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(candidate);
        }
      }}
    >
      <div className="card-top-row">
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
          <div className="candidate-avatar">{initials}</div>
          <div className="candidate-info">
            <h3 className="candidate-name">{candidate.name}</h3>
            <div className="candidate-role">{candidate.role}</div>
          </div>
        </div>

        <div className={`duration-badge ${duration.isStalled && !isHired && !isRejected ? 'stalled' : ''}`}>
          {duration.isStalled && !isHired && !isRejected ? (
            <AlertTriangle size={12} />
          ) : (
            <Clock size={12} />
          )}
          <span>{duration.formatted}</span>
        </div>
      </div>

      {/* Tags */}
      {candidate.tags && candidate.tags.length > 0 && (
        <div className="card-tags">
          {candidate.tags.slice(0, 3).map((tag, tIdx) => (
            <span key={tIdx} className="tag-badge">
              {tag}
            </span>
          ))}
          {candidate.tags.length > 3 && (
            <span className="tag-badge">+{candidate.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Active Search Match Indicator */}
      {matchReasons && matchReasons.length > 0 && (
        <div className="match-reason-box" title={matchReasons.join(', ')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: '0.8rem' }}>🎯</span>
            <span style={{ fontWeight: 600 }}>{matchReasons[0]}</span>
          </div>
        </div>
      )}

      {/* Stage Actions & Terminal State Locks */}
      <div className="card-actions-row" onClick={(e) => e.stopPropagation()}>
        {isHired && (
          <div className="terminal-badge hired" title="Hired candidates cannot be moved or reversed">
            <CheckCircle size={14} />
            <span>Outcome Final: Hired</span>
          </div>
        )}

        {isRejected && (
          <div className="terminal-badge rejected" title="Rejected candidates cannot be altered">
            <Ban size={14} />
            <span>Outcome Final: Rejected</span>
          </div>
        )}

        {!isHired && !isRejected && (
          <>
            {canAdvance && nextStage ? (
              <button
                className="btn-advance"
                onClick={(e) => onAdvance(candidate, e)}
                title={`Advance ${candidate.name} to ${nextStage}`}
              >
                <span>Advance to {nextStage}</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                At Final Pipeline Stage
              </span>
            )}

            {canReject && (
              <button
                className="btn-card-reject"
                onClick={(e) => onReject(candidate, e)}
                title={`Reject ${candidate.name}`}
              >
                <Ban size={13} />
              </button>
            )}
          </>
        )}

        {/* Audit trail indicator */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', color: 'var(--text-dim)', fontSize: '0.72rem' }} title={`${candidate.auditTrail.length} immutable audit logs recorded`}>
          <ShieldCheck size={13} style={{ marginRight: 3, color: '#10b981' }} />
          <span>{candidate.auditTrail.length}</span>
        </div>
      </div>
    </div>
  );
};
