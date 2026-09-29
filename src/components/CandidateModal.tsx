import React, { useState } from 'react';
import {
  X,
  Clock,
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  Lock,
} from 'lucide-react';
import type {
  Candidate,
  PipelineStage,
} from '../types/pipeline';
import {
  PIPELINE_STAGES,
  PipelineStateMachine,
} from '../types/pipeline';
import {
  getStageDuration,
  formatAuditTimestamp,
  getRelativeTimeString,
} from '../utils/time';

interface CandidateModalProps {
  candidate: Candidate | null;
  onClose: () => void;
  onAdvance: (candidate: Candidate) => void;
  onReject: (candidate: Candidate, reason: string) => void;
}

export const CandidateModal: React.FC<CandidateModalProps> = ({
  candidate,
  onClose,
  onAdvance,
  onReject,
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  if (!candidate) return null;

  const duration = getStageDuration(candidate.stageEnteredAt);
  const { allowed: canAdvance, nextStage } =
    PipelineStateMachine.canAdvance(candidate);
  const { allowed: canReject } =
    PipelineStateMachine.canReject(candidate);

  const isHired = candidate.status === 'HIRED';
  const isRejected = candidate.status === 'REJECTED';

  const currentStageIndex = PIPELINE_STAGES.indexOf(
    candidate.currentStage as PipelineStage
  );

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason or note for this rejection decision.');
      return;
    }
    onReject(candidate, rejectReason.trim());
    setIsRejecting(false);
    setRejectReason('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-modal-title"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div className="candidate-avatar" style={{ width: 44, height: 44, fontSize: '1.05rem' }}>
              {candidate.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <h2 id="candidate-modal-title" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                {candidate.name}
              </h2>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                {candidate.role}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ color: 'var(--text-dim)', padding: '0.35rem', borderRadius: '50%' }}
            title="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Candidate Overview Card */}
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
              <Mail size={15} style={{ color: 'var(--primary-500)' }} />
              <span style={{ color: 'var(--text-muted)' }}>{candidate.email}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
              <Phone size={15} style={{ color: 'var(--primary-500)' }} />
              <span style={{ color: 'var(--text-muted)' }}>{candidate.phone}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
              <Calendar size={15} style={{ color: 'var(--primary-500)' }} />
              <span style={{ color: 'var(--text-muted)' }}>
                Applied {getRelativeTimeString(candidate.createdAt)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
              <Clock size={15} style={{ color: duration.isStalled ? 'var(--warning-amber)' : 'var(--primary-500)' }} />
              <span style={{ fontWeight: 600, color: duration.isStalled ? 'var(--warning-amber)' : '#fff' }}>
                In {candidate.currentStage}: {duration.formatted}
              </span>
            </div>
          </div>

          {/* Stalled Alert if >= 7 days in stage */}
          {duration.isStalled && !isHired && !isRejected && (
            <div
              style={{
                marginTop: '1rem',
                background: 'var(--warning-bg)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                color: '#fde68a',
                fontSize: '0.84rem',
              }}
            >
              <AlertTriangle size={18} style={{ color: 'var(--warning-amber)', flexShrink: 0 }} />
              <div>
                <strong>Pipeline Alert:</strong> Candidate has been waiting in{' '}
                <strong>{candidate.currentStage}</strong> for {duration.formatted} (&gt; 7 days). Needs recruiter follow-up.
              </div>
            </div>
          )}

          {/* Pipeline Sequential Progression Stepper */}
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pipeline Stage Progression
            </div>

            <div className="pipeline-stepper">
              {PIPELINE_STAGES.map((stage, idx) => {
                const isPassed = !isRejected && currentStageIndex > idx;
                const isCurrent = !isRejected && candidate.currentStage === stage;

                let stepClass = '';
                if (isCurrent) stepClass = 'current';
                else if (isPassed) stepClass = 'completed';

                return (
                  <div key={stage} className={`stepper-step ${stepClass}`}>
                    <div className="stepper-circle">
                      {isPassed ? (
                        <CheckCircle size={16} />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <span className="stepper-label">{stage}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes & Candidate Tags */}
          {candidate.notes && (
            <div style={{ marginTop: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
                RECRUITER PROFILE NOTES
              </div>
              <p style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{candidate.notes}</p>
            </div>
          )}

          {/* ============================================================== */}
          {/* IMMUTABLE AUDIT TRAIL TIMELINE                                 */}
          {/* ============================================================== */}
          <div className="audit-section">
            <div className="audit-header-banner">
              <Lock size={16} style={{ color: '#10b981', flexShrink: 0 }} />
              <div>
                <strong>Tamper-Evident Immutable Audit Trail:</strong> Each transition is permanently sealed with a cryptographic fingerprint. Records cannot be edited, skipped, or erased.
              </div>
            </div>

            <div className="audit-timeline">
              {candidate.auditTrail.map((entry) => {
                const isReject = entry.action === 'CANDIDATE_REJECTED';
                const isHiredAction = entry.toStage === 'Hired';

                return (
                  <div key={entry.id} className="audit-node">
                    <div
                      className={`audit-node-point ${isReject ? 'action-reject' : ''} ${isHiredAction ? 'action-hired' : ''}`}
                    />

                    <div className="audit-node-header">
                      <div className="audit-action-title">
                        {entry.action === 'CANDIDATE_CREATED' && 'Candidate Applied & Created'}
                        {entry.action === 'STAGE_TRANSITION' && (
                          <span>
                            Transitioned: {entry.fromStage} &rarr; <strong>{entry.toStage}</strong>
                          </span>
                        )}
                        {entry.action === 'CANDIDATE_REJECTED' && (
                          <span style={{ color: 'var(--stage-rejected)' }}>
                            Outcome Recorded: Rejected
                          </span>
                        )}
                      </div>
                      <span className="audit-timestamp">
                        {formatAuditTimestamp(entry.timestamp)} ({getRelativeTimeString(entry.timestamp)})
                      </span>
                    </div>

                    <div className="audit-meta-row">
                      <span>Recorded by: <strong>{entry.actor}</strong></span>
                      {entry.fromStage && <span>• From: {entry.fromStage}</span>}
                      <span>• Stage: {entry.toStage}</span>
                    </div>

                    {entry.reason && (
                      <div className="audit-note-box">
                        <strong>Reason / Note:</strong> {entry.reason}
                      </div>
                    )}

                    <div className="audit-hash-code">
                      <ShieldCheck size={11} style={{ color: '#10b981' }} />
                      <span>Seal: {entry.immutableSignature}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rejection Prompt Form (if active) */}
        {isRejecting && (
          <div
            style={{
              padding: '1rem 1.5rem',
              background: 'rgba(244, 63, 94, 0.08)',
              borderTop: '1px solid rgba(244, 63, 94, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fda4af' }}>
              Confirm Rejection Reason (Required for Audit Trail):
            </div>
            <textarea
              style={{
                width: '100%',
                background: 'var(--bg-surface)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem 0.75rem',
                color: '#fff',
                fontSize: '0.85rem',
                minHeight: '60px',
              }}
              placeholder="e.g. Candidate accepted competing offer, or skills mismatch during panel..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setIsRejecting(false);
                  setRejectReason('');
                }}
              >
                Cancel
              </button>
              <button
                style={{
                  background: 'var(--stage-rejected)',
                  color: '#fff',
                  padding: '0.45rem 0.95rem',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
                onClick={handleConfirmReject}
              >
                Record Permanent Rejection
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="modal-footer">
          {/* Terminal status warnings */}
          {isHired && (
            <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--stage-hired)', fontSize: '0.84rem', fontWeight: 600 }}>
              <CheckCircle size={16} />
              <span>Candidate is Hired. Outcome is final and immutable.</span>
            </div>
          )}

          {isRejected && (
            <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--stage-rejected)', fontSize: '0.84rem', fontWeight: 600 }}>
              <Ban size={16} />
              <span>Candidate is Rejected. Outcome cannot be reversed.</span>
            </div>
          )}

          {!isHired && !isRejected && !isRejecting && (
            <>
              {canReject && (
                <button
                  className="btn-secondary"
                  style={{ color: '#fda4af', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                  onClick={() => setIsRejecting(true)}
                  title="Reject candidate with recorded reason"
                >
                  <Ban size={15} />
                  <span>Reject Candidate</span>
                </button>
              )}

              {canAdvance && nextStage && (
                <button
                  className="btn-primary"
                  onClick={() => onAdvance(candidate)}
                  title={`Advance to ${nextStage}`}
                >
                  <span>Advance to {nextStage}</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </>
          )}

          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
