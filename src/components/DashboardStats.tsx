import React from 'react';
import { Users, Clock, AlertTriangle, Trophy, ShieldCheck, TrendingUp, Sparkles, Filter } from 'lucide-react';
import type { Candidate } from '../types/pipeline';
import { getStageDuration } from '../utils/time';

interface DashboardStatsProps {
  candidates: readonly Candidate[];
  onFilterStalled: () => void;
  onFilterActive: () => void;
  onFilterHired: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  candidates,
  onFilterStalled,
  onFilterActive,
  onFilterHired,
}) => {
  const total = candidates.length;
  const activeCandidates = candidates.filter((c) => c.status === 'ACTIVE');
  const hiredCandidates = candidates.filter((c) => c.status === 'HIRED');

  // Stalled candidates (> 7 days)
  const stalledCandidates = activeCandidates.filter(
    (c) => getStageDuration(c.stageEnteredAt).isStalled
  );

  // Compute average dwell time in active stages (in days)
  const totalDays = activeCandidates.reduce((acc, c) => {
    return acc + getStageDuration(c.stageEnteredAt).days;
  }, 0);
  const avgDwellDays = activeCandidates.length > 0 ? (totalDays / activeCandidates.length).toFixed(1) : '0';

  // Total immutable audit logs across entire requisition
  const totalAuditEvents = candidates.reduce((acc, c) => acc + c.auditTrail.length, 0);

  // Offer acceptance / completion rate
  const candidatesReachedOffer = candidates.filter((c) =>
    c.auditTrail.some((e) => e.toStage === 'Offer')
  ).length;
  const offerSuccessRate =
    candidatesReachedOffer > 0 ? Math.round((hiredCandidates.length / candidatesReachedOffer) * 100) : 0;

  return (
    <div className="dashboard-stats-grid">
      {/* Card 1: Active Talent Pool */}
      <div className="stats-card card-glow-indigo" onClick={onFilterActive} role="button" tabIndex={0} title="Click to filter active candidates">
        <div className="stats-card-top">
          <span className="stats-label">Active Talent Pool</span>
          <div className="stats-icon-badge indigo">
            <Users size={16} />
          </div>
        </div>
        <div className="stats-value-row">
          <span className="stats-number">{activeCandidates.length}</span>
          <span className="stats-total-tag">of {total} total</span>
        </div>
        <div className="stats-footer-text">
          <TrendingUp size={13} style={{ color: '#818cf8' }} />
          <span>Across 4 active pipeline stages</span>
        </div>
      </div>

      {/* Card 2: Pipeline Dwell Time & SLA Bottleneck */}
      <div
        className={`stats-card ${stalledCandidates.length > 0 ? 'card-glow-amber' : 'card-glow-blue'}`}
        onClick={onFilterStalled}
        role="button"
        tabIndex={0}
        title="Click to search stalled candidates (> 7 days)"
      >
        <div className="stats-card-top">
          <span className="stats-label">Pipeline Velocity (Avg)</span>
          <div className={`stats-icon-badge ${stalledCandidates.length > 0 ? 'amber' : 'blue'}`}>
            {stalledCandidates.length > 0 ? <AlertTriangle size={16} /> : <Clock size={16} />}
          </div>
        </div>
        <div className="stats-value-row">
          <span className="stats-number">{avgDwellDays}d</span>
          {stalledCandidates.length > 0 && (
            <span className="stats-alert-pill">
              <span className="alert-pulse-dot" />
              {stalledCandidates.length} Stalled (&gt;7d)
            </span>
          )}
        </div>
        <div className="stats-footer-text">
          <Filter size={12} style={{ color: '#f59e0b' }} />
          <span>Target SLA: &lt; 5 days per stage</span>
        </div>
      </div>

      {/* Card 3: Offer Conversion & Hires */}
      <div className="stats-card card-glow-emerald" onClick={onFilterHired} role="button" tabIndex={0} title="Click to filter hired candidates">
        <div className="stats-card-top">
          <span className="stats-label">Offer Conversion</span>
          <div className="stats-icon-badge emerald">
            <Trophy size={16} />
          </div>
        </div>
        <div className="stats-value-row">
          <span className="stats-number">{hiredCandidates.length} Hired</span>
          <span className="stats-rate-pill">{offerSuccessRate}% Win Rate</span>
        </div>
        <div className="stats-footer-text">
          <Sparkles size={12} style={{ color: '#10b981' }} />
          <span>{candidatesReachedOffer} candidates reached final offer</span>
        </div>
      </div>

      {/* Card 4: Cryptographic Compliance & Audit Logs */}
      <div className="stats-card card-glow-purple" title="Cryptographically sealed immutable event log">
        <div className="stats-card-top">
          <span className="stats-label">Compliance Audit Trail</span>
          <div className="stats-icon-badge purple">
            <ShieldCheck size={16} />
          </div>
        </div>
        <div className="stats-value-row">
          <span className="stats-number">{totalAuditEvents}</span>
          <span className="stats-audit-pill">100% Immutable</span>
        </div>
        <div className="stats-footer-text">
          <span className="compliance-dot" />
          <span>SHA-256 Tamper-evident ledger sealed</span>
        </div>
      </div>
    </div>
  );
};
