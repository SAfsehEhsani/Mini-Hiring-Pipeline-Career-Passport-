import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { KanbanSquare, Table, BarChart3 } from 'lucide-react';
import type { Candidate, AuditEntry } from './types/pipeline';
import { PipelineStateMachine } from './types/pipeline';
import { getInitialCandidates } from './data/mockCandidates';
import { parseRecruiterQuery, searchAndRankCandidates } from './utils/searchEngine';
import { generateAuditSignature } from './utils/time';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { DashboardStats } from './components/DashboardStats';
import { KanbanBoard } from './components/KanbanBoard';
import { ListView } from './components/ListView';
import { CandidateModal } from './components/CandidateModal';
import { AddCandidateModal } from './components/AddCandidateModal';
import { ArchitectureModal } from './components/ArchitectureModal';

const STORAGE_KEY = 'mini_hiring_pipeline_candidates_v2';

export function App() {
  // Initialize state from localStorage or dynamic mock data
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load candidates from storage:', e);
    }
    return getInitialCandidates();
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
    } catch (e) {
      console.error('Failed to persist candidates:', e);
    }
  }, [candidates]);

  // Keyboard shortcut Ctrl/Cmd + K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('.main-search-input') as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Parse query & execute search scoring
  const parsedQuery = useMemo(() => {
    return parseRecruiterQuery(searchQuery);
  }, [searchQuery]);

  const searchResult = useMemo(() => {
    return searchAndRankCandidates(candidates, parsedQuery);
  }, [candidates, parsedQuery]);

  // Selected candidate object
  const selectedCandidate = useMemo(() => {
    return candidates.find((c) => c.id === selectedCandidateId) || null;
  }, [candidates, selectedCandidateId]);

  // Pipeline stage distribution
  const stageStats = useMemo(() => {
    const total = candidates.length || 1;
    const stages = [
      { name: 'Applied', color: '#38bdf8', count: candidates.filter((c) => c.currentStage === 'Applied').length },
      { name: 'Screening', color: '#fbbf24', count: candidates.filter((c) => c.currentStage === 'Screening').length },
      { name: 'Interview', color: '#a855f7', count: candidates.filter((c) => c.currentStage === 'Interview').length },
      { name: 'Offer', color: '#ec4899', count: candidates.filter((c) => c.currentStage === 'Offer').length },
      { name: 'Hired', color: '#10b981', count: candidates.filter((c) => c.currentStage === 'Hired' || c.status === 'HIRED').length },
    ];
    return stages.map((s) => ({
      ...s,
      percentage: Math.round((s.count / total) * 100),
    }));
  }, [candidates]);

  // Advance Candidate Stage
  const handleAdvanceCandidate = useCallback(
    (candidate: Candidate, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();

      const validation = PipelineStateMachine.canAdvance(candidate);
      if (!validation.allowed || !validation.nextStage) {
        alert(validation.reason || 'Cannot advance this candidate.');
        return;
      }

      const nextStage = validation.nextStage;
      const nowISO = new Date().toISOString();

      const newAudit: AuditEntry = {
        id: `aud_${Math.random().toString(36).substring(2, 9)}`,
        candidateId: candidate.id,
        timestamp: nowISO,
        action: 'STAGE_TRANSITION',
        fromStage: candidate.currentStage as any,
        toStage: nextStage,
        actor: 'Recruiter (You)',
        reason:
          nextStage === 'Hired'
            ? 'Candidate accepted offer contract. Status updated to Hired!'
            : `Advanced from ${candidate.currentStage} to ${nextStage}`,
        immutableSignature: generateAuditSignature({
          candidateId: candidate.id,
          timestamp: nowISO,
          action: 'STAGE_TRANSITION',
          fromStage: candidate.currentStage,
          toStage: nextStage,
          actor: 'Recruiter (You)',
        }),
      };

      if (nextStage === 'Hired') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      setCandidates((prev) =>
        prev.map((c) => {
          if (c.id === candidate.id) {
            return {
              ...c,
              currentStage: nextStage,
              status: nextStage === 'Hired' ? 'HIRED' : 'ACTIVE',
              stageEnteredAt: nowISO,
              auditTrail: [...c.auditTrail, newAudit],
            };
          }
          return c;
        })
      );
    },
    []
  );

  // Reject Candidate
  const handleRejectCandidate = useCallback(
    (candidate: Candidate, reason: string = 'Recruiter decision') => {
      const validation = PipelineStateMachine.canReject(candidate);
      if (!validation.allowed) {
        alert(validation.reason || 'Candidate cannot be rejected.');
        return;
      }

      const nowISO = new Date().toISOString();
      const newAudit: AuditEntry = {
        id: `aud_${Math.random().toString(36).substring(2, 9)}`,
        candidateId: candidate.id,
        timestamp: nowISO,
        action: 'CANDIDATE_REJECTED',
        fromStage: candidate.currentStage as any,
        toStage: 'Rejected',
        actor: 'Recruiter (You)',
        reason,
        immutableSignature: generateAuditSignature({
          candidateId: candidate.id,
          timestamp: nowISO,
          action: 'CANDIDATE_REJECTED',
          fromStage: candidate.currentStage,
          toStage: 'Rejected',
          actor: 'Recruiter (You)',
        }),
      };

      setCandidates((prev) =>
        prev.map((c) => {
          if (c.id === candidate.id) {
            return {
              ...c,
              currentStage: 'Rejected',
              status: 'REJECTED',
              stageEnteredAt: nowISO,
              auditTrail: [...c.auditTrail, newAudit],
            };
          }
          return c;
        })
      );
    },
    []
  );

  // Quick reject from card
  const handleQuickReject = useCallback(
    (candidate: Candidate, e: React.MouseEvent) => {
      e.stopPropagation();
      const reason = window.prompt(
        `Enter rejection reason for ${candidate.name} (required for immutable audit record):`,
        'Skills mismatch or candidate pursued other opportunities'
      );
      if (reason && reason.trim()) {
        handleRejectCandidate(candidate, reason.trim());
      }
    },
    [handleRejectCandidate]
  );

  // Add Candidate
  const handleAddCandidate = useCallback((newCandidate: Candidate) => {
    setCandidates((prev) => [newCandidate, ...prev]);
  }, []);

  // Reset Demo Data
  const handleResetData = useCallback(() => {
    if (window.confirm('Reset candidate pipeline to default demo candidates?')) {
      const fresh = getInitialCandidates();
      setCandidates(fresh);
      setSearchQuery('');
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  return (
    <div className="app-container">
      {/* Dynamic Cyber-Aurora Background Lighting */}
      <div className="bg-aurora-glow" aria-hidden="true">
        <div className="glow-orb orb-indigo" />
        <div className="glow-orb orb-violet" />
        <div className="glow-orb orb-cyan" />
        <div className="glow-orb orb-emerald" />
        <div className="glow-orb orb-rose" />
      </div>

      <Header
        candidates={candidates}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onResetData={handleResetData}
        onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
      />

      <main className="main-content">
        {/* Executive Dashboard KPI Metrics */}
        <DashboardStats
          candidates={candidates}
          onFilterActive={() => setSearchQuery('active')}
          onFilterStalled={() => setSearchQuery('stuck for more than a week')}
          onFilterHired={() => setSearchQuery('stage:hired')}
        />

        {/* Intelligent NLP & Fuzzy Search */}
        <SearchBar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          parsedQuery={parsedQuery}
          totalMatches={searchResult.results.length}
        />

        {/* Executive View Switcher & Stage Breakdown Toolbar */}
        <div className="dashboard-view-bar">
          <div className="view-bar-left">
            <div className="distribution-wrapper">
              <div className="distribution-label">
                <BarChart3 size={13} style={{ color: 'var(--primary-400)' }} />
                <span>Stage Flow:</span>
              </div>
              <div className="distribution-ribbon" title="Click any stage segment to filter">
                {stageStats.map((st) => (
                  <div
                    key={st.name}
                    className="distribution-segment"
                    style={{
                      width: `${Math.max(st.percentage, 5)}%`,
                      backgroundColor: st.color,
                    }}
                    onClick={() => setSearchQuery(st.name.toLowerCase())}
                    title={`${st.name}: ${st.count} candidates (${st.percentage}%) - Click to filter`}
                  />
                ))}
              </div>
              <div className="distribution-legend">
                {stageStats.map((st) => (
                  <button
                    key={st.name}
                    className="legend-item-btn"
                    onClick={() => setSearchQuery(st.name.toLowerCase())}
                    title={`Filter by ${st.name}`}
                  >
                    <span className="legend-dot" style={{ backgroundColor: st.color }} />
                    <span className="legend-name">{st.name}</span>
                    <span className="legend-count">{st.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="view-mode-toggle-group">
            <button
              className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Kanban Board View (Visual Drag & Stage Progression)"
            >
              <KanbanSquare size={14} />
              <span>Kanban Board</span>
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Executive Table View (High-density Tabular Ledger)"
            >
              <Table size={14} />
              <span>Table List</span>
            </button>
          </div>
        </div>

        {/* Main Pipeline Display: Kanban Board OR Executive Table */}
        {viewMode === 'kanban' ? (
          <KanbanBoard
            candidates={candidates}
            scoredResults={searchResult.results}
            isSearching={searchQuery.trim().length > 0}
            onSelectCandidate={(c) => setSelectedCandidateId(c.id)}
            onAdvanceCandidate={handleAdvanceCandidate}
            onRejectCandidate={handleQuickReject}
          />
        ) : (
          <ListView
            candidates={candidates}
            scoredResults={searchResult.results}
            isSearching={searchQuery.trim().length > 0}
            onSelectCandidate={(c) => setSelectedCandidateId(c.id)}
            onAdvanceCandidate={handleAdvanceCandidate}
            onRejectCandidate={handleQuickReject}
          />
        )}
      </main>

      {/* Candidate Modal with History & Audit Trail */}
      <CandidateModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidateId(null)}
        onAdvance={(c) => handleAdvanceCandidate(c)}
        onReject={(c, reason) => handleRejectCandidate(c, reason)}
      />

      {/* Add Candidate Modal */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCandidate={handleAddCandidate}
      />

      {/* Architecture & Engineering Decisions Modal */}
      <ArchitectureModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
      />
    </div>
  );
}

export default App;
