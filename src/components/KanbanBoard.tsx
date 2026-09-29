import React, { useState } from 'react';
import type { Candidate, PipelineStage, ScoredCandidate } from '../types/pipeline';
import { PIPELINE_STAGES } from '../types/pipeline';
import { CandidateCard } from './CandidateCard';
import { Ban } from 'lucide-react';

interface KanbanBoardProps {
  candidates: readonly Candidate[];
  scoredResults?: ScoredCandidate[];
  isSearching: boolean;
  onSelectCandidate: (candidate: Candidate) => void;
  onAdvanceCandidate: (candidate: Candidate, e: React.MouseEvent) => void;
  onRejectCandidate: (candidate: Candidate, e: React.MouseEvent) => void;
}

const STAGE_DOT_COLORS: Record<PipelineStage | 'Rejected', string> = {
  Applied: '#38bdf8',
  Screening: '#fbbf24',
  Interview: '#a855f7',
  Offer: '#ec4899',
  Hired: '#10b981',
  Rejected: '#f43f5e',
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  candidates,
  scoredResults,
  isSearching,
  onSelectCandidate,
  onAdvanceCandidate,
  onRejectCandidate,
}) => {
  const [showRejectedColumn, setShowRejectedColumn] = useState(false);

  // Group candidates by stage
  const getCandidatesForStage = (stage: PipelineStage | 'Rejected'): { candidate: Candidate; matchReasons?: string[] }[] => {
    if (isSearching && scoredResults) {
      return scoredResults
        .filter((sc) => sc.candidate.currentStage === stage)
        .map((sc) => ({ candidate: sc.candidate, matchReasons: sc.matchReasons }));
    }

    return candidates
      .filter((c) => c.currentStage === stage)
      .map((c) => ({ candidate: c }));
  };

  const rejectedCount = candidates.filter((c) => c.currentStage === 'Rejected' || c.status === 'REJECTED').length;

  return (
    <div className="pipeline-wrapper">
      <div className="pipeline-view-controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Pipeline View
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Strict sequential state machine (Applied &rarr; Screening &rarr; Interview &rarr; Offer &rarr; Hired)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className={`rejected-drawer-btn ${showRejectedColumn ? 'active' : ''}`}
            onClick={() => setShowRejectedColumn(!showRejectedColumn)}
            title="Toggle rejected candidates column"
          >
            <Ban size={14} />
            <span>{showRejectedColumn ? 'Hide Rejected' : `Show Rejected (${rejectedCount})`}</span>
          </button>
        </div>
      </div>

      <div
        className="kanban-grid"
        style={{
          gridTemplateColumns: showRejectedColumn
            ? 'repeat(6, minmax(250px, 1fr))'
            : 'repeat(5, minmax(260px, 1fr))',
        }}
      >
        {PIPELINE_STAGES.map((stage) => {
          const items = getCandidatesForStage(stage);
          return (
            <div key={stage} className={`kanban-column stage-col-${stage.toLowerCase()}`}>
              <div className="kanban-column-header">
                <div className="col-title-group">
                  <span
                    className="stage-dot"
                    style={{ backgroundColor: STAGE_DOT_COLORS[stage] }}
                  />
                  <span className="col-name">{stage}</span>
                </div>
                <span className="col-count-pill">{items.length}</span>
              </div>

              <div className="kanban-column-body">
                {items.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '2.5rem 1rem',
                      color: 'var(--text-dim)',
                      fontSize: '0.82rem',
                    }}
                  >
                    No candidates in {stage}
                  </div>
                ) : (
                  items.map(({ candidate, matchReasons }) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      matchReasons={matchReasons}
                      onSelect={onSelectCandidate}
                      onAdvance={onAdvanceCandidate}
                      onReject={onRejectCandidate}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}

        {/* Optional Rejected Column */}
        {showRejectedColumn && (
          <div className="kanban-column stage-col-rejected">
            <div
              className="kanban-column-header"
              style={{ background: 'rgba(244, 63, 94, 0.08)' }}
            >
              <div className="col-title-group">
                <span
                  className="stage-dot"
                  style={{ backgroundColor: STAGE_DOT_COLORS.Rejected }}
                />
                <span className="col-name" style={{ color: '#fda4af' }}>
                  Rejected
                </span>
              </div>
              <span
                className="col-count-pill"
                style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#fda4af' }}
              >
                {getCandidatesForStage('Rejected').length}
              </span>
            </div>

            <div className="kanban-column-body">
              {getCandidatesForStage('Rejected').length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2rem 1rem',
                    color: 'var(--text-dim)',
                    fontSize: '0.82rem',
                  }}
                >
                  No rejected candidates
                </div>
              ) : (
                getCandidatesForStage('Rejected').map(({ candidate, matchReasons }) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    matchReasons={matchReasons}
                    onSelect={onSelectCandidate}
                    onAdvance={onAdvanceCandidate}
                    onReject={onRejectCandidate}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
