import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { Candidate, AuditEntry } from './types/pipeline';
import { PipelineStateMachine } from './types/pipeline';
import { getInitialCandidates } from './data/mockCandidates';
import { parseRecruiterQuery, searchAndRankCandidates } from './utils/searchEngine';
import { generateAuditSignature } from './utils/time';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { KanbanBoard } from './components/KanbanBoard';
import { CandidateModal } from './components/CandidateModal';
import { AddCandidateModal } from './components/AddCandidateModal';
import { ArchitectureModal } from './components/ArchitectureModal';

const STORAGE_KEY = 'mini_hiring_pipeline_candidates_v1';

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
      <Header
        candidates={candidates}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onResetData={handleResetData}
        onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
      />

      <main className="main-content">
        <SearchBar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          parsedQuery={parsedQuery}
          totalMatches={searchResult.results.length}
        />

        <KanbanBoard
          candidates={candidates}
          scoredResults={searchResult.results}
          isSearching={searchQuery.trim().length > 0}
          onSelectCandidate={(c) => setSelectedCandidateId(c.id)}
          onAdvanceCandidate={handleAdvanceCandidate}
          onRejectCandidate={handleQuickReject}
        />
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
