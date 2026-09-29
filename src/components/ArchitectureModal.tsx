import React from 'react';
import { X, FileText, Printer, ShieldCheck, Cpu, Code2, AlertTriangle } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-sheet"
        style={{ maxWidth: 840, maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="logo-icon" style={{ width: 34, height: 34 }}>
              <FileText size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                Architecture &amp; Engineering Decisions
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Mini Hiring Pipeline • Assignment Documentation &amp; AI Disagreement
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn-secondary" onClick={handlePrint} title="Print or save as PDF">
              <Printer size={15} />
              <span>Export / Print PDF</span>
            </button>
            <button onClick={onClose} style={{ color: 'var(--text-dim)' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: 1.6 }}>
          {/* Section 1: Executive Architecture Overview */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-200)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={18} />
              <span>1. System Architecture &amp; State Machine</span>
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#cbd5e1' }}>
              The application is engineered around a <strong>Finite State Machine (FSM)</strong> with strict sequential transition invariants and an <strong>Event-Sourced Append-Only Audit Store</strong>:
            </p>
            <ul style={{ fontSize: '0.84rem', color: '#94a3b8', paddingLeft: '1.25rem', marginTop: '0.4rem' }}>
              <li>
                <strong>Progression Invariant:</strong> Candidates can only advance sequentially: <code>Applied &rarr; Screening &rarr; Interview &rarr; Offer &rarr; Hired</code>. Skipping stages (e.g. Applied &rarr; Offer) is prohibited at the domain layer.
              </li>
              <li>
                <strong>Terminal State Locks:</strong> <code>Hired</code> and <code>Rejected</code> are immutable sinks. Reversals or subsequent transitions are permanently disallowed.
              </li>
              <li>
                <strong>Cryptographic Audit Log:</strong> Every lifecycle change emits an <code>AuditEntry</code> sealed with a tamper-evident signature (<code>sha256:aud_...</code>) containing actor, fromStage, toStage, timestamp, and rationale.
              </li>
            </ul>
          </div>

          {/* Section 2: Search Engine Design */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-200)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Code2 size={18} />
              <span>2. Intelligent Query Engine (Natural Language &amp; Fuzzy)</span>
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#cbd5e1' }}>
              Rather than hardcoding string checks or requiring slow external cloud APIs, the single search box uses a <strong>deterministic, zero-latency hybrid parser</strong>:
            </p>
            <ul style={{ fontSize: '0.84rem', color: '#94a3b8', paddingLeft: '1.25rem', marginTop: '0.4rem' }}>
              <li>
                <strong>Damerau-Levenshtein Fuzzy Matching:</strong> Evaluates edits and adjacent transpositions (e.g. <code>"sharam"</code> &harr; <code>"Sharma"</code>), allowing recruiters to find candidates despite typos.
              </li>
              <li>
                <strong>Temporal Relative Resolver:</strong> Dynamically interprets <code>"since Monday"</code> relative to the calendar, inspecting transition logs on or after that day.
              </li>
              <li>
                <strong>Duration &amp; Milestone Engine:</strong> Computes stage elapsed time (e.g. <code>"stuck in Screening for more than a week"</code>) and historical audit milestones (e.g. <code>"reached Offer but didn't get hired"</code>).
              </li>
              <li>
                <strong>Explainability &amp; Diagnostics:</strong> If a query yields 0 results, the engine does not silently fail. It explains why (e.g. longest stalled candidate in Screening is 9 days vs requested 30 days) and provides suggestion chips.
              </li>
            </ul>
          </div>

          {/* Section 3: Disagreement with AI */}
          <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--warning-amber)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={18} />
              <span>3. Human-in-the-Loop: Where I Disagreed with the AI</span>
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#fde68a' }}>
              <strong>The AI Proposal:</strong> The initial suggestion was to integrate an external cloud LLM (e.g., OpenAI or Claude API) to parse every search keystroke into JSON filters, or alternatively use simple regex string lookups.
            </p>
            <p style={{ fontSize: '0.86rem', color: '#e2e8f0', marginTop: '0.5rem' }}>
              <strong>Why I Disagreed &amp; The Superior Alternative:</strong>
            </p>
            <ul style={{ fontSize: '0.84rem', color: '#cbd5e1', paddingLeft: '1.25rem', marginTop: '0.3rem' }}>
              <li>
                <em>Recruiter Latency &amp; Reliability:</em> Calling an external LLM on every keystroke adds 500–1200ms latency, rate limits, and failure modes when offline or without API keys.
              </li>
              <li>
                <em>Candidate Privacy (PII):</em> Recruiter applicant data contains private names, emails, and phone numbers. Streaming user search inputs to a 3rd-party LLM introduces compliance risks (GDPR/SOC2).
              </li>
              <li>
                <em>Deterministic Explainability:</em> LLMs frequently hallucinate or produce non-deterministic filter criteria. By designing an in-browser tokenized intent extractor with exact Damerau-Levenshtein distance and calendar-anchored date resolvers, the recruiter gets <strong>sub-millisecond instant feedback</strong>, 100% offline reliability, zero privacy leak, and clear explainability.
              </li>
            </ul>
          </div>

          {/* Section 4: What We'd Do With More Time */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-200)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={18} />
              <span>4. What We'd Do With More Time</span>
            </h3>
            <ul style={{ fontSize: '0.84rem', color: '#94a3b8', paddingLeft: '1.25rem' }}>
              <li>
                <strong>Multi-Requisition &amp; Department Pipelines:</strong> Expand from single-job support to multi-requisition pipelines with custom configurable stages per department (e.g., Sales vs Engineering loops).
              </li>
              <li>
                <strong>Distributed Event Sourcing (CQRS/Kafka):</strong> Back the audit trail with an append-only event store (e.g., Apache Kafka / EventStoreDB / Postgres write-ahead log) ensuring distributed multi-recruiter synchronization via WebSockets.
              </li>
              <li>
                <strong>Cryptographic Merkle Tree Audit Verification:</strong> Chain audit log signatures into a cryptographic Merkle DAG, allowing external auditors to cryptographically verify that zero entries were modified or backdated.
              </li>
              <li>
                <strong>Automated SLA Alerts &amp; Calendar Integrations:</strong> Automated Slack/Email notifications when candidates approach stage SLAs (&gt; 5 days in Screening), plus direct Google Calendar / Outlook interview scheduling.
              </li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={15} />
            <span>Print / Save as PDF</span>
          </button>
          <button className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
