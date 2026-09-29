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
  Copy,
  Check,
  Eye,
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

/**
 * Generates polite, stage-tailored decline email drafts purely on the client side (0 external APIs)
 */
function generateDeclineEmail(candidate: Candidate, reason: string, recruiterName: string = 'The Recruiting Team'): { subject: string; body: string } {
  const stage = candidate.currentStage;
  const firstName = candidate.name.split(' ')[0] || candidate.name;

  if (stage === 'Offer') {
    return {
      subject: `Update regarding offer discussions — ${candidate.role}`,
      body: `Dear ${firstName},

Thank you very much for taking the time to speak with our leadership team regarding the offer for the ${candidate.role} position.

While we had hoped to welcome you to our team, we understand and respect the outcome of our discussions${reason ? ` (${reason})` : ''}. We truly enjoyed learning about your background and were thoroughly impressed with your technical capabilities.

We wish you the very best in your next career chapter and would welcome the opportunity to reconnect for future senior leadership roles.

Warm regards,
${recruiterName}`,
    };
  }

  if (stage === 'Interview') {
    return {
      subject: `Interview loop feedback — ${candidate.role}`,
      body: `Dear ${firstName},

Thank you for dedicating significant time and energy to interview with our engineering panel for the ${candidate.role} opening.

Our team was genuinely impressed by your technical depth and problem-solving approach. However, after careful deliberation across several strong candidates${reason ? `, and noting that ${reason}` : ''}, we have decided to proceed with another applicant whose specific expertise more closely aligns with our immediate architectural focus.

We want to thank you for the thoughtful conversations and wish you continued success in your search. We will keep your profile active in our talent pool for future openings that match your skills.

Best regards,
${recruiterName}`,
    };
  }

  if (stage === 'Screening') {
    return {
      subject: `Update on your application for ${candidate.role}`,
      body: `Dear ${firstName},

Thank you for taking the time to speak with us during the initial screening round for the ${candidate.role} position.

At this stage, we have decided not to advance your application to the technical interview loop${reason ? ` due to ${reason}` : ''}. We appreciate the opportunity to learn about your achievements and the value you bring.

We encourage you to monitor our careers page for future roles that align with your background.

Sincerely,
${recruiterName}`,
    };
  }

  // Default Applied Stage
  return {
    subject: `Application update for ${candidate.role}`,
    body: `Dear ${firstName},

Thank you for your interest in joining our team and for submitting your application for the ${candidate.role} position.

We received a high volume of accomplished applicants for this requisition. While your qualifications are noteworthy${reason ? `, ${reason}` : ''}, we have decided to proceed with other candidates whose profiles more directly match our current requirements.

Thank you again for your time and interest in our organization.

Best wishes,
${recruiterName}`,
  };
}

export const CandidateModal: React.FC<CandidateModalProps> = ({
  candidate,
  onClose,
  onAdvance,
  onReject,
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

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
    setShowEmailPreview(false);
  };

  const emailDraft = generateDeclineEmail(candidate, rejectReason.trim());

  const handleCopyEmail = () => {
    const fullText = `Subject: ${emailDraft.subject}\n\n${emailDraft.body}`;
    navigator.clipboard.writeText(fullText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
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

        {/* Rejection Prompt & Context-Aware Email Preview Drawer */}
        {isRejecting && (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              background: 'rgba(244, 63, 94, 0.08)',
              borderTop: '1px solid rgba(244, 63, 94, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fda4af' }}>
                Confirm Rejection &amp; Audit Rationale
              </div>

              {/* Toggle Email Preview */}
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.76rem', padding: '0.25rem 0.65rem' }}
                onClick={() => setShowEmailPreview(!showEmailPreview)}
              >
                <Eye size={13} />
                <span>{showEmailPreview ? 'Hide Candidate Email' : 'Preview Polite Decline Email'}</span>
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Rejection Rationale (Permanently sealed in candidate audit log) *
              </label>
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
            </div>

            {/* Context-Aware Decline Email Preview (Feature 5) */}
            {showEmailPreview && (
              <div className="email-preview-card">
                <div className="email-preview-header">
                  <div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                      To: <strong>{candidate.name}</strong> &lt;{candidate.email}&gt;
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600, marginTop: 2 }}>
                      Subject: {emailDraft.subject}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '0.74rem', padding: '0.25rem 0.55rem' }}
                    onClick={handleCopyEmail}
                    title="Copy full draft to clipboard"
                  >
                    {copiedEmail ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                    <span>{copiedEmail ? 'Copied!' : 'Copy Draft'}</span>
                  </button>
                </div>

                <div className="email-preview-body">
                  {emailDraft.body}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setIsRejecting(false);
                  setRejectReason('');
                  setShowEmailPreview(false);
                }}
              >
                Cancel
              </button>
              <button
                style={{
                  background: 'var(--stage-rejected)',
                  color: '#fff',
                  padding: '0.45rem 1rem',
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
