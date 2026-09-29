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
            <Briefcase size={20} />
          </div>
          <div className="job-title-group">
            <h1>
              Mini Hiring Pipeline Dashboard
              <span className="live-status-pill">
                <span className="live-status-dot" />
                LIVE WORKSPACE
              </span>
            </h1>
            <div className="job-subtext">
              Recruiter Workspace • End-to-End Talent Pipeline &amp; Audit Ledger
            </div>
          </div>
        </div>

        <div className="header-metrics-bar">
          <div className="metric-pill" title="Total candidates tracked for this requisition">
            <Users size={14} className="metric-icon" />
            <span>Total: <strong>{total}</strong></span>
          </div>

          <div className="metric-pill active-pill" title="Active candidates in progress">
            <span className="active-dot" />
            <span>Active: <strong>{activeCount}</strong></span>
          </div>

          <div className={`metric-pill ${stalledCount > 0 ? 'stalled-pill' : ''}`} title="Candidates waiting in current stage for >= 7 days">
            <AlertTriangle size={14} className="metric-icon" />
            <span>Stalled (&gt;7d): <strong>{stalledCount}</strong></span>
          </div>

          <div className="metric-pill hired-pill" title="Candidates with signed offers">
            <CheckCircle2 size={14} className="metric-icon" />
            <span>Hired: <strong>{hiredCount}</strong></span>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={onResetData}
            title="Reset data back to the default demonstration test candidates"
          >
            <RotateCcw size={14} />
            <span>Reset Demo</span>
          </button>

          <button
            className="btn-secondary"
            onClick={onOpenArchitectureModal}
            title="View system architecture, design decisions, and export documentation"
          >
            <FileText size={14} />
            <span>Architecture &amp; Report</span>
          </button>

          <button
            className="btn-primary"
            onClick={onOpenAddModal}
            title="Add a new candidate to the Applied stage"
          >
            <UserPlus size={15} />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>
    </header>
  );
};
