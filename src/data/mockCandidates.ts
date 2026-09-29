/**
 * Dynamic Mock Candidates with Audit Trail and Time Anchors
 * Timestamps are computed relative to Date.now() so tests like 'since Monday'
 * or 'stuck in Screening for > 1 week' work reliably at any time.
 */

import type { Candidate, AuditEntry } from '../types/pipeline';
import { generateAuditSignature, resolveDayOfWeek } from '../utils/time';

/**
 * Helper to build an immutable audit entry
 */
function createAudit(
  candidateId: string,
  timestamp: string,
  action: AuditEntry['action'],
  fromStage: AuditEntry['fromStage'],
  toStage: AuditEntry['toStage'],
  actor: string = 'Recruiter (You)',
  reason?: string
): AuditEntry {
  const immutableSignature = generateAuditSignature({
    candidateId,
    timestamp,
    action,
    fromStage,
    toStage,
    actor,
  });

  return {
    id: `aud_${Math.random().toString(36).substring(2, 9)}`,
    candidateId,
    timestamp,
    action,
    fromStage,
    toStage,
    actor,
    reason,
    immutableSignature,
  };
}

/**
 * Returns dynamic sample candidates anchored to current time
 */
export function getInitialCandidates(referenceDate: Date = new Date()): Candidate[] {
  const now = referenceDate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  // Resolve previous Monday for "since Monday" tests
  const lastMonday = resolveDayOfWeek('Monday', referenceDate);
  // Place transition comfortably after Monday (e.g., Tuesday or 1 day ago)
  const movedToInterviewDate = new Date(Math.max(lastMonday.getTime() + 12 * 60 * 60 * 1000, now - 1.5 * dayMs));

  return [
    // 1. Priya Sharma (Fuzzy target 'sharam' + Stuck in Screening for > 1 week)
    {
      id: 'cand-001',
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      phone: '+1 (555) 392-1048',
      role: 'Senior Full Stack Engineer',
      currentStage: 'Screening',
      status: 'ACTIVE',
      createdAt: new Date(now - 14 * dayMs).toISOString(),
      stageEnteredAt: new Date(now - 9 * dayMs).toISOString(), // 9 days in Screening (Stuck > 7 days)
      notes: 'Strong React & Node background. Portfolio includes high-scale fintech systems.',
      tags: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      auditTrail: [
        createAudit(
          'cand-001',
          new Date(now - 14 * dayMs).toISOString(),
          'CANDIDATE_CREATED',
          null,
          'Applied',
          'System (Job Board)',
          'Applied via LinkedIn Career Portal'
        ),
        createAudit(
          'cand-001',
          new Date(now - 9 * dayMs).toISOString(),
          'STAGE_TRANSITION',
          'Applied',
          'Screening',
          'Recruiter (You)',
          'Resume screened; matches core requirements. Needs tech screener assignment.'
        ),
      ],
    },

    // 2. Marcus Chen (Moved to Interview since Monday)
    {
      id: 'cand-002',
      name: 'Marcus Chen',
      email: 'marcus.chen@example.com',
      phone: '+1 (555) 749-3821',
      role: 'Staff Systems Architect',
      currentStage: 'Interview',
      status: 'ACTIVE',
      createdAt: new Date(now - 8 * dayMs).toISOString(),
      stageEnteredAt: movedToInterviewDate.toISOString(), // Transitioned after Monday!
      notes: 'Deep expertise in distributed consensus, Raft protocol, and Rust microservices.',
      tags: ['Rust', 'Distributed Systems', 'Go', 'Kubernetes'],
      auditTrail: [
        createAudit(
          'cand-002',
          new Date(now - 8 * dayMs).toISOString(),
          'CANDIDATE_CREATED',
          null,
          'Applied',
          'System (Referral)',
          'Internal referral by Engineering Director'
        ),
        createAudit(
          'cand-002',
          new Date(now - 5 * dayMs).toISOString(),
          'STAGE_TRANSITION',
          'Applied',
          'Screening',
          'Recruiter (You)',
          'Passed recruiter intro call.'
        ),
        createAudit(
          'cand-002',
          movedToInterviewDate.toISOString(),
          'STAGE_TRANSITION',
          'Screening',
          'Interview',
          'Recruiter (You)',
          'Advanced to panel loop following stellar technical screener score.'
        ),
      ],
    },

    // 3. Amina Diallo (Reached Offer stage but didn't get hired -> REJECTED after Offer)
    {
      id: 'cand-003',
      name: 'Amina Diallo',
      email: 'amina.diallo@example.com',
      phone: '+1 (555) 819-2049',
      role: 'Principal Backend Engineer',
      currentStage: 'Rejected',
      status: 'REJECTED',
      createdAt: new Date(now - 30 * dayMs).toISOString(),
      stageEnteredAt: new Date(now - 4 * dayMs).toISOString(),
      notes: 'Reached final Offer stage. Candidate ultimately accepted a competing counter-offer.',
      tags: ['Java', 'Kafka', 'AWS', 'High Throughput'],
      auditTrail: [
        createAudit('cand-003', new Date(now - 30 * dayMs).toISOString(), 'CANDIDATE_CREATED', null, 'Applied'),
        createAudit('cand-003', new Date(now - 25 * dayMs).toISOString(), 'STAGE_TRANSITION', 'Applied', 'Screening'),
        createAudit('cand-003', new Date(now - 18 * dayMs).toISOString(), 'STAGE_TRANSITION', 'Screening', 'Interview'),
        createAudit('cand-003', new Date(now - 8 * dayMs).toISOString(), 'STAGE_TRANSITION', 'Interview', 'Offer', 'Recruiter (You)', 'Extended written offer of $185k base + equity'),
        createAudit(
          'cand-003',
          new Date(now - 4 * dayMs).toISOString(),
          'CANDIDATE_REJECTED',
          'Offer',
          'Rejected',
          'Recruiter (You)',
          'Candidate declined offer due to competing retention package from current employer.'
        ),
      ],
    },

    // 4. Elena Rostova (In Interview right now)
    {
      id: 'cand-004',
      name: 'Elena Rostova',
      email: 'elena.rostova@example.com',
      phone: '+1 (555) 438-9921',
      role: 'Senior Product Designer',
      currentStage: 'Interview',
      status: 'ACTIVE',
      createdAt: new Date(now - 10 * dayMs).toISOString(),
      stageEnteredAt: new Date(now - 3 * dayMs).toISOString(),
      notes: 'Figma systems lead, completed portfolio walk; scheduled for cross-functional interview.',
      tags: ['Design Systems', 'Figma', 'User Research'],
      auditTrail: [
        createAudit('cand-004', new Date(now - 10 * dayMs).toISOString(), 'CANDIDATE_CREATED', null, 'Applied'),
        createAudit('cand-004', new Date(now - 6 * dayMs).toISOString(), 'STAGE_TRANSITION', 'Applied', 'Screening'),
        createAudit('cand-004', new Date(now - 3 * dayMs).toISOString(), 'STAGE_TRANSITION', 'Screening', 'Interview'),
      ],
    },

    // 5. Devon Taylor (In Applied stage)
    {
      id: 'cand-005',
      name: 'Devon Taylor',
      email: 'devon.taylor@example.com',
      phone: '+1 (555) 234-8712',
      role: 'Site Reliability Engineer',
      currentStage: 'Applied',
      status: 'ACTIVE',
      createdAt: new Date(now - 2 * dayMs).toISOString(),
      stageEnteredAt: new Date(now - 2 * dayMs).toISOString(),
      notes: 'Strong Terraform, Prometheus, and multi-region AWS incident response background.',
      tags: ['Kubernetes', 'Terraform', 'Prometheus', 'AWS'],
      auditTrail: [
        createAudit('cand-005', new Date(now - 2 * dayMs).toISOString(), 'CANDIDATE_CREATED', null, 'Applied'),
      ],
    },

    // 6. Aarav Patel (Stuck in Screening for 12 days)
    {
      id: 'cand-006',
      name: 'Aarav Patel',
      email: 'aarav.patel@example.com',
      phone: '+1 (555) 662-1190',
      role: 'Machine Learning Infrastructure Engineer',
      currentStage: 'Screening',
      status: 'ACTIVE',
      createdAt: new Date(now - 16 * dayMs).toISOString(),
      stageEnteredAt: new Date(now - 12 * dayMs).toISOString(), // 12 days in Screening
      notes: 'PyTorch, Triton inference server, waiting on hiring manager review for 12 days.',
      tags: ['PyTorch', 'CUDA', 'Python', 'MLOps'],
      auditTrail: [
        createAudit('cand-006', new Date(now - 16 * dayMs).toISOString(), 'CANDIDATE_CREATED', null, 'Applied'),
        createAudit('cand-006', new Date(now - 12 * dayMs).toISOString(), 'STAGE_TRANSITION', 'Applied', 'Screening'),
      ],
    },

    // 7. Sarah Jenkins (HIRED - Terminal Success)
    {
      id: 'cand-007',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      phone: '+1 (555) 902-3341',
      role: 'Engineering Manager',
      currentStage: 'Hired',
      status: 'HIRED',
      createdAt: new Date(now - 45 * dayMs).toISOString(),
      stageEnteredAt: new Date(now - 5 * dayMs).toISOString(),
      notes: 'Offer signed! Onboarding scheduled for 1st of next month.',
      tags: ['Leadership', 'Agile', 'Scale'],
      auditTrail: [
        createAudit('cand-007', new Date(now - 45 * dayMs).toISOString(), 'CANDIDATE_CREATED', null, 'Applied'),
        createAudit('cand-007', new Date(now - 38 * dayMs).toISOString(), 'STAGE_TRANSITION', 'Applied', 'Screening'),
        createAudit('cand-007', new Date(now - 24 * dayMs).toISOString(), 'STAGE_TRANSITION', 'Screening', 'Interview'),
        createAudit('cand-007', new Date(now - 10 * dayMs).toISOString(), 'STAGE_TRANSITION', 'Interview', 'Offer'),
        createAudit('cand-007', new Date(now - 5 * dayMs).toISOString(), 'STAGE_TRANSITION', 'Offer', 'Hired', 'Recruiter (You)', 'Offer contract signed electronically.'),
      ],
    },

    // 8. Carlos Mendez (Rejected at early stage)
    {
      id: 'cand-008',
      name: 'Carlos Mendez',
      email: 'carlos.mendez@example.com',
      phone: '+1 (555) 541-8890',
      role: 'QA Automation Engineer',
      currentStage: 'Rejected',
      status: 'REJECTED',
      createdAt: new Date(now - 15 * dayMs).toISOString(),
      stageEnteredAt: new Date(now - 13 * dayMs).toISOString(),
      notes: 'Insufficient automation experience for senior role. Sent warm polite decline email.',
      tags: ['Cypress', 'Selenium'],
      auditTrail: [
        createAudit('cand-008', new Date(now - 15 * dayMs).toISOString(), 'CANDIDATE_CREATED', null, 'Applied'),
        createAudit('cand-008', new Date(now - 13 * dayMs).toISOString(), 'CANDIDATE_REJECTED', 'Applied', 'Rejected', 'Recruiter (You)', 'Skills mismatch on distributed system testing.'),
      ],
    },

    // 9. Lucas Silva (Moved to Interview since Monday)
    {
      id: 'cand-009',
      name: 'Lucas Silva',
      email: 'lucas.silva@example.com',
      phone: '+1 (555) 887-2134',
      role: 'Senior iOS / Swift Engineer',
      currentStage: 'Interview',
      status: 'ACTIVE',
      createdAt: new Date(now - 6 * dayMs).toISOString(),
      stageEnteredAt: new Date(now - 1 * dayMs).toISOString(), // Yesterday
      notes: 'Impressive App Store portfolio; SwiftUI and Metal experience.',
      tags: ['iOS', 'Swift', 'SwiftUI'],
      auditTrail: [
        createAudit('cand-009', new Date(now - 6 * dayMs).toISOString(), 'CANDIDATE_CREATED', null, 'Applied'),
        createAudit('cand-009', new Date(now - 3 * dayMs).toISOString(), 'STAGE_TRANSITION', 'Applied', 'Screening'),
        createAudit('cand-009', new Date(now - 1 * dayMs).toISOString(), 'STAGE_TRANSITION', 'Screening', 'Interview', 'Recruiter (You)', 'Advanced to technical architectural round.'),
      ],
    },

    // 10. Zainab Abbas (Currently in Offer stage)
    {
      id: 'cand-010',
      name: 'Zainab Abbas',
      email: 'zainab.abbas@example.com',
      phone: '+1 (555) 771-4450',
      role: 'Senior Security Architect',
      currentStage: 'Offer',
      status: 'ACTIVE',
      createdAt: new Date(now - 20 * dayMs).toISOString(),
      stageEnteredAt: new Date(now - 2 * dayMs).toISOString(),
      notes: 'Offer package sent yesterday; waiting on candidate response by Friday.',
      tags: ['Application Security', 'SOC2', 'Pen Testing'],
      auditTrail: [
        createAudit('cand-010', new Date(now - 20 * dayMs).toISOString(), 'CANDIDATE_CREATED', null, 'Applied'),
        createAudit('cand-010', new Date(now - 14 * dayMs).toISOString(), 'STAGE_TRANSITION', 'Applied', 'Screening'),
        createAudit('cand-010', new Date(now - 7 * dayMs).toISOString(), 'STAGE_TRANSITION', 'Screening', 'Interview'),
        createAudit('cand-010', new Date(now - 2 * dayMs).toISOString(), 'STAGE_TRANSITION', 'Interview', 'Offer', 'Recruiter (You)', 'Formal offer package delivered.'),
      ],
    },
  ];
}
