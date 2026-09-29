import React from 'react';
import { ArrowRight, Ban, CheckCircle, Clock, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import type { Candidate, ScoredCandidate } from '../types/pipeline';
import { PipelineStateMachine } from '../types/pipeline';
import { getStageDuration } from '../utils/time';

interface ListViewProps {
  candidates: readonly Candidate[];
  scoredResults?: ScoredCandidate[];
  isSearching: boolean;
  onSelectCandidate: (candidate: Candidate) => void;
  onAdvanceCandidate: (candidate: Candidate, e: React.MouseEvent) => void;
  onRejectCandidate: (candidate: Candidate, e: React.MouseEvent) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  candidates,
  scoredResults,
  isSearching,
  onSelectCandidate,
  onAdvanceCandidate,
  onRejectCandidate,
}) => {
  const displayItems = isSearching && scoredResults
    ? scoredResults.map((sc) => ({ candidate: sc.candidate, matchReasons: sc.matchReasons, score: sc.score }))
    : candidates.map((c) => ({ candidate: c, matchReasons: undefined, score: undefined }));

  return (
    <div className="list-view-container">
      <div className="table-responsive">
        <table className="pipeline-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Current Stage</th>
              <th>Time in Stage</th>
              <th>Audit Sealed Events</th>
              {isSearching && <th>Match Relevance</th>}
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.length === 0 ? (
              <tr>
                <td colSpan={isSearching ? 6 : 5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                  No candidates match the current criteria.
                </td>
              </tr>
            ) : (
              displayItems.map(({ candidate, matchReasons }) => {
                const duration = getStageDuration(candidate.stageEnteredAt);
                const { allowed: canAdvance, nextStage } = PipelineStateMachine.canAdvance(candidate);
                const { allowed: canReject } = PipelineStateMachine.canReject(candidate);
                const isHired = candidate.status === 'HIRED';
                const isRejected = candidate.status === 'REJECTED';

                const initials = candidate.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2);

                return (
                  <tr
                    key={candidate.id}
                    onClick={() => onSelectCandidate(candidate)}
                    className="table-row-hover"
                  >
                    {/* Candidate Name & Info */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="table-avatar">{initials}</div>
                        <div>
                          <div className="table-candidate-name">{candidate.name}</div>
                          <div className="table-candidate-role">{candidate.role} • {candidate.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Stage Badge */}
                    <td>
                      <span className={`table-stage-pill stage-${candidate.currentStage.toLowerCase()}`}>
                        <span className="stage-dot-mini" />
                        {candidate.currentStage}
                      </span>
                    </td>

                    {/* Time in Stage */}
                    <td>
                      <div className={`duration-badge ${duration.isStalled && !isHired && !isRejected ? 'stalled' : ''}`}>
                        {duration.isStalled && !isHired && !isRejected ? (
                          <AlertTriangle size={12} className="stalled-icon-pulse" />
                        ) : (
                          <Clock size={12} />
                        )}
                        <span>{duration.formatted}</span>
                      </div>
                    </td>

                    {/* Audit Logs */}
                    <td>
                      <div className="audit-seal-pill" style={{ display: 'inline-flex' }}>
                        <ShieldCheck size={13} style={{ color: '#10b981' }} />
                        <span>{candidate.auditTrail.length} records</span>
                      </div>
                    </td>

                    {/* Match Reasons (if searching) */}
                    {isSearching && (
                      <td>
                        {matchReasons && matchReasons.length > 0 ? (
                          <div className="match-reason-box" style={{ padding: '0.2rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Sparkles size={12} style={{ color: '#818cf8' }} />
                            <span>{matchReasons[0]}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Standard match</span>
                        )}
                      </td>
                    )}

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                        {isHired && (
                          <span className="terminal-badge hired">
                            <CheckCircle size={13} />
                            <span>Hired</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="terminal-badge rejected">
                            <Ban size={13} />
                            <span>Rejected</span>
                          </span>
                        )}
                        {!isHired && !isRejected && (
                          <>
                            {canAdvance && nextStage && (
                              <button
                                className="btn-advance"
                                style={{ padding: '0.35rem 0.75rem' }}
                                onClick={(e) => onAdvanceCandidate(candidate, e)}
                              >
                                <span>Advance to {nextStage}</span>
                                <ArrowRight size={13} />
                              </button>
                            )}
                            {canReject && (
                              <button
                                className="btn-card-reject"
                                onClick={(e) => onRejectCandidate(candidate, e)}
                                title="Reject candidate"
                              >
                                <Ban size={13} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
