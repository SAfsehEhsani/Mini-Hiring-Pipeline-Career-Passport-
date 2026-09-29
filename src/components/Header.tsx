import React from 'react';
import { Briefcase, UserPlus, RotateCcw, FileText, AlertTriangle, CheckCircle2, Users } from 'lucide-react';
import type { Candidate } from '../types/pipeline';
import { getStageDuration } from '../utils/time';

interface HeaderProps {
  candidates: readonly Candidate[];
  onOpenAddModal: () => void;
  onResetData: () => void;
  onOpenArchitectureModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  candidates,
  onOpenAddModal,
  onResetData,
  onOpenArchitectureModal,
}) => {
  const total = candidates.length;
  const activeCount = candidates.filter((c) => c.status === 'ACTIVE').length;
  const hiredCount = candidates.filter((c) => c.status === 'HIRED').length;
  const stalledCount = candidates.filter(
    (c) => c.status === 'ACTIVE' && getStageDuration(c.stageEnteredAt).isStalled
  ).length;

  return (
    <header className="top-navbar">
      <div className="nav-inner">
        <div className="brand-section">
          <div className="logo-icon" title="Mini Hiring Pipeline">
            <Briefcase size={22} />
          </div>
          <div className="job-title-group">
            <h1>
              Senior Staff Software Engineer
              <span className="job-req-badge">REQ #4029</span>
            </h1>
            <div className="job-subtext">
              Recruiter Workspace • Pipeline Management &amp; Talent Discovery
            </div>
          </div>
        </div>

        <div className="header-metrics-bar">
          <div className="metric-pill" title="Total candidates tracked for this requisition">
            <Users size={14} />
            <span>Total: <strong>{total}</strong></span>
          </div>

          <div className="metric-pill" title="Active candidates in progress">
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#6366f1', display: 'inline-block' }} />
            <span>Active: <strong>{activeCount}</strong></span>
          </div>

          <div className={`metric-pill ${stalledCount > 0 ? 'stalled-pill' : ''}`} title="Candidates waiting in current stage for >= 7 days">
            <AlertTriangle size={14} />
            <span>Stalled (&gt;7d): <strong>{stalledCount}</strong></span>
          </div>

          <div className="metric-pill hired-pill" title="Candidates with signed offers">
            <CheckCircle2 size={14} />
            <span>Hired: <strong>{hiredCount}</strong></span>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={onResetData}
            title="Reset data back to the default demonstration test candidates"
          >
            <RotateCcw size={15} />
            <span>Reset Demo</span>
          </button>

          <button
            className="btn-secondary"
            onClick={onOpenArchitectureModal}
            title="View system architecture, design decisions, and export documentation"
          >
            <FileText size={15} />
            <span>Architecture &amp; Report</span>
          </button>

          <button
            className="btn-primary"
            onClick={onOpenAddModal}
            title="Add a new candidate to the Applied stage"
          >
            <UserPlus size={16} />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>
    </header>
  );
};
