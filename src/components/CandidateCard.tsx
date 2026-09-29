import React from 'react';
import { Clock, AlertTriangle, ArrowRight, Ban, CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';
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

// Curated modern gradients for candidate avatars
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
];

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

  // Deterministic avatar gradient based on candidate name
  const gradientIdx = Math.abs(
    candidate.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ) % AVATAR_GRADIENTS.length;
  const avatarBg = AVATAR_GRADIENTS[gradientIdx];

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
      {/* Top Row: Avatar, Name, Role & Live Duration Meter */}
      <div className="card-top-row">
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', minWidth: 0 }}>
          <div className="candidate-avatar" style={{ background: avatarBg }}>
            {initials}
          </div>
          <div className="candidate-info">
            <h3 className="candidate-name" title={candidate.name}>{candidate.name}</h3>
            <div className="candidate-role" title={candidate.role}>{candidate.role}</div>
          </div>
        </div>

        <div
          className={`duration-badge ${duration.isStalled && !isHired && !isRejected ? 'stalled' : ''}`}
          title={duration.isStalled ? `Stalled in current stage for ${duration.days} days (> 7 days SLA)` : 'Time spent in current stage'}
        >
          {duration.isStalled && !isHired && !isRejected ? (
            <AlertTriangle size={12} className="stalled-icon-pulse" />
          ) : (
            <Clock size={12} />
          )}
          <span>{duration.formatted}</span>
        </div>
      </div>

      {/* Skill Tags */}
      {candidate.tags && candidate.tags.length > 0 && (
        <div className="card-tags">
          {candidate.tags.slice(0, 3).map((tag, tIdx) => (
            <span key={tIdx} className="tag-badge">
              {tag}
            </span>
          ))}
          {candidate.tags.length > 3 && (
            <span className="tag-badge more-tag">+{candidate.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Active Search Match Indicator */}
      {matchReasons && matchReasons.length > 0 && (
        <div className="match-reason-box" title={matchReasons.join(' • ')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Sparkles size={13} style={{ color: '#818cf8', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {matchReasons[0]}
            </span>
          </div>
        </div>
      )}

      {/* Stage Actions & Terminal State Locks */}
      <div className="card-actions-row" onClick={(e) => e.stopPropagation()}>
        {isHired && (
          <div className="terminal-badge hired" title="Hired candidates cannot be moved or reversed">
            <CheckCircle size={14} />
            <span>Hired • Outcome Final</span>
          </div>
        )}

        {isRejected && (
          <div className="terminal-badge rejected" title="Rejected candidates cannot be altered">
            <Ban size={14} />
            <span>Rejected • Outcome Final</span>
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
                <ArrowRight size={13} className="advance-arrow" />
              </button>
            ) : (
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                Final Active Stage
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

        {/* Cryptographic Audit Trail Sealed Indicator */}
        <div
          className="audit-seal-pill"
          title={`${candidate.auditTrail.length} tamper-evident audit events recorded`}
        >
          <ShieldCheck size={13} style={{ color: '#10b981' }} />
          <span>{candidate.auditTrail.length}</span>
        </div>
      </div>
    </div>
  );
};
