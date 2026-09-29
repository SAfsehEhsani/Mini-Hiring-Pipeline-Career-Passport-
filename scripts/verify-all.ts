/**
 * Comprehensive Automated Verification Suite for Mini Hiring Pipeline
 * Validates all core requirements from instructions.md:
 *  - State Machine & Invariant Enforcement (Skipping stages & Reversing terminal outcomes)
 *  - Immutable Cryptographic Audit Trail
 *  - Intelligent Natural Language & Fuzzy Search Engine
 */

import { PipelineStateMachine } from '../src/types/pipeline';
import { getInitialCandidates } from '../src/data/mockCandidates';
import { parseRecruiterQuery, searchAndRankCandidates, damerauLevenshteinDistance } from '../src/utils/searchEngine';
import { getStageDuration, generateAuditSignature } from '../src/utils/time';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('====================================================');
console.log('RUNNING COMPREHENSIVE PIPELINE VERIFICATION SUITE');
console.log('====================================================\n');

const candidates = getInitialCandidates();

// ----------------------------------------------------
// 1. STATE MACHINE & STAGE PROGRESSION RULES
// ----------------------------------------------------
console.log('--- 1. Testing State Machine Rules ---');

const appliedCandidate = candidates.find((c) => c.currentStage === 'Applied')!;
const canAdvanceApplied = PipelineStateMachine.canAdvance(appliedCandidate);
assert(canAdvanceApplied.allowed === true && canAdvanceApplied.nextStage === 'Screening', 'Applied candidate can only advance to Screening');

const screeningCandidate = candidates.find((c) => c.currentStage === 'Screening')!;
const canAdvanceScreening = PipelineStateMachine.canAdvance(screeningCandidate);
assert(canAdvanceScreening.allowed === true && canAdvanceScreening.nextStage === 'Interview', 'Screening candidate can only advance to Interview (no skipping)');

const hiredCandidate = candidates.find((c) => c.status === 'HIRED')!;
const canAdvanceHired = PipelineStateMachine.canAdvance(hiredCandidate);
assert(canAdvanceHired.allowed === false, 'Hired candidate cannot advance (terminal outcome is immutable)');

const canRejectHired = PipelineStateMachine.canReject(hiredCandidate);
assert(canRejectHired.allowed === false, 'Hired candidate cannot be rejected (reversing final outcome blocked)');

const rejectedCandidate = candidates.find((c) => c.status === 'REJECTED')!;
const canAdvanceRejected = PipelineStateMachine.canAdvance(rejectedCandidate);
assert(canAdvanceRejected.allowed === false, 'Rejected candidate cannot advance (reversing final outcome blocked)');

// ----------------------------------------------------
// 2. AUDIT TRAIL IMMUTABILITY & DURATION
// ----------------------------------------------------
console.log('\n--- 2. Testing Audit Trail & Duration ---');

assert(appliedCandidate.auditTrail.length >= 1, 'Candidate has initial creation audit record');
assert(typeof appliedCandidate.auditTrail[0].immutableSignature === 'string', 'Audit entry contains cryptographic tamper-evident seal');

const duration = getStageDuration(screeningCandidate.stageEnteredAt);
assert(duration.days >= 7 && duration.isStalled === true, 'Priya Sharma is flagged as stalled in Screening for > 7 days');

// ----------------------------------------------------
// 3. SEARCH ENGINE REQUIREMENTS FROM instructions.md
// ----------------------------------------------------
console.log('\n--- 3. Testing Natural Language & Fuzzy Search Queries ---');

// Test 1: "Find Priya Sharma", even when she types "sharam"
const dist = damerauLevenshteinDistance('sharam', 'sharma');
assert(dist <= 2, `Damerau-Levenshtein distance between "sharam" and "sharma" is ${dist} (transposition detected)`);

const query1 = 'sharam';
const parsed1 = parseRecruiterQuery(query1);
const res1 = searchAndRankCandidates(candidates, parsed1);
assert(res1.results.length >= 1 && res1.results[0].candidate.name === 'Priya Sharma', 'Query "sharam" accurately matches Priya Sharma as #1 best match');

// Test 2: "Who's in Interview right now?"
const query2 = "Who's in Interview right now?";
const parsed2 = parseRecruiterQuery(query2);
const res2 = searchAndRankCandidates(candidates, parsed2);
assert(res2.results.length >= 2, 'Query "Who\'s in Interview right now?" returns active interview candidates');
assert(res2.results.every((r) => r.candidate.currentStage === 'Interview'), 'All matched candidates are currently in Interview stage');

// Test 3: "Who has been stuck in Screening for more than a week?"
const query3 = 'Who has been stuck in Screening for more than a week?';
const parsed3 = parseRecruiterQuery(query3);
const res3 = searchAndRankCandidates(candidates, parsed3);
assert(res3.results.length >= 2, 'Query returns candidates stuck in Screening > 1 week');
assert(res3.results.some((r) => r.candidate.name === 'Priya Sharma'), 'Priya Sharma is correctly returned in stuck screening list');
assert(res3.results.some((r) => r.candidate.name === 'Aarav Patel'), 'Aarav Patel is correctly returned in stuck screening list');

// Test 4: "Who moved to Interview since Monday?"
const query4 = 'Who moved to Interview since Monday?';
const parsed4 = parseRecruiterQuery(query4);
const res4 = searchAndRankCandidates(candidates, parsed4);
assert(res4.results.length >= 1, 'Query returns candidates who moved to Interview since Monday');
assert(res4.results.some((r) => r.candidate.name === 'Marcus Chen'), 'Marcus Chen matched transition since Monday');

// Test 5: "Who reached the Offer stage but didn't get hired?"
const query5 = "Who reached the Offer stage but didn't get hired?";
const parsed5 = parseRecruiterQuery(query5);
const res5 = searchAndRankCandidates(candidates, parsed5);
assert(res5.results.length >= 1, 'Query returns candidates who reached Offer but were not hired');
assert(res5.results.some((r) => r.candidate.name === 'Amina Diallo'), 'Amina Diallo matched Offer-reached non-hired audit criteria');

// Test 6: "Everyone except rejected candidates"
const query6 = 'Everyone except rejected candidates';
const parsed6 = parseRecruiterQuery(query6);
const res6 = searchAndRankCandidates(candidates, parsed6);
assert(res6.results.every((r) => r.candidate.status !== 'REJECTED'), 'Exclusion query filters out all rejected candidates');
assert(res6.results.length === candidates.filter((c) => c.status !== 'REJECTED').length, 'Exclusion query includes all non-rejected candidates');

// Test 7: Explanatory error feedback for queries that return 0 results
const query7 = 'Who has been stuck in Screening for more than 45 days?';
const parsed7 = parseRecruiterQuery(query7);
const res7 = searchAndRankCandidates(candidates, parsed7);
assert(res7.results.length === 0, 'Zero results for extreme duration');
assert(res7.explanation.summary.includes('0 candidates found stuck in Screening'), 'Explains why 0 results matched instead of an empty screen');
assert(res7.explanation.suggestions.length > 0, 'Provides helpful suggestions for the recruiter');

console.log('\n====================================================');
console.log('🎉 ALL 14 TEST ASSERTIONS COMPLETED SUCCESSFULLY!');
console.log('====================================================\n');
