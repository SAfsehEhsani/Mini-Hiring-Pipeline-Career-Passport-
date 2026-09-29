/**
 * Intelligent Recruiter Search Engine
 * Features:
 *  - Damerau-Levenshtein Fuzzy Name Matching (e.g. 'sharam' -> 'Priya Sharma')
 *  - Stage & Status Intent Extraction ('in Interview right now')
 *  - Live Duration / Stalled Detection ('stuck in Screening for more than a week')
 *  - Audit Trail Recency Analysis ('moved to Interview since Monday')
 *  - Historical Milestone Check ('reached Offer stage but didn't get hired')
 *  - Negative Exclusion Filters ('everyone except rejected candidates')
 *  - Compound Query Composition with Relevance Ranking
 *  - Natural Language Explainability & Feedback
 */

import type { Candidate, PipelineStage, ParsedSearchQuery, ScoredCandidate } from '../types/pipeline';
import { resolveDayOfWeek } from './time';

/**
 * Calculates Damerau-Levenshtein distance between two strings
 * Handles insertions, deletions, substitutions, and adjacent transpositions (e.g. 'ra' <-> 'ar')
 */
export function damerauLevenshteinDistance(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const matrix: number[][] = [];
  for (let i = 0; i <= al; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bl; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );

      // Transposition check
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
      }
    }
  }

  return matrix[al][bl];
}

/**
 * Computes normalized fuzzy similarity between 0.0 and 1.0
 */
export function fuzzySimilarity(str1: string, str2: string): number {
  const s1 = str1.trim().toLowerCase();
  const s2 = str2.trim().toLowerCase();
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const maxLen = Math.max(s1.length, s2.length);
  const distance = damerauLevenshteinDistance(s1, s2);
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Evaluates candidate name against a search token, testing full name, first name, and last name
 */
export function evaluateFuzzyNameMatch(candidateName: string, queryToken: string): { matches: boolean; score: number; bestToken: string } {
  const cleanQuery = queryToken.toLowerCase().trim();
  const cleanName = candidateName.toLowerCase().trim();

  // Exact full or partial substring
  if (cleanName.includes(cleanQuery)) {
    return { matches: true, score: 0.95, bestToken: cleanQuery };
  }

  const nameParts = cleanName.split(/\s+/);
  let bestScore = 0;
  let bestMatchedPart = '';

  for (const part of [...nameParts, cleanName]) {
    const sim = fuzzySimilarity(part, cleanQuery);
    if (sim > bestScore) {
      bestScore = sim;
      bestMatchedPart = part;
    }
  }

  // Also test sub-word matching if query length is >= 4
  if (bestScore < 0.65 && cleanQuery.length >= 4) {
    for (const part of nameParts) {
      if (part.length >= 4) {
        // Compare prefixes
        const prefixSim = fuzzySimilarity(part.substring(0, cleanQuery.length), cleanQuery);
        if (prefixSim > bestScore) {
          bestScore = prefixSim * 0.9;
          bestMatchedPart = part;
        }
      }
    }
  }

  // Threshold: 0.60 allows "sharam" (distance 2 from "sharma", len 6 -> 4/6 = 0.667)
  const matches = bestScore >= 0.60;
  return { matches, score: bestScore, bestToken: bestMatchedPart };
}

/**
 * Normalizes query string and removes conversational recruiter boilerplate
 */
function cleanConversationalPrefixes(query: string): string {
  return query
    .replace(/\b(who('s|’s|se| is| are| has| was| were)?|has been|have been|had been|been|was|were|is|are|show me|find me|find|get|list|display|all|everyone|candidates?|candidate)\b/gi, ' ')
    .replace(/[?!,.:;'"“”’`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Stage synonyms dictionary
 */
const STAGE_SYNONYMS: Record<string, PipelineStage | 'Rejected'> = {
  applied: 'Applied',
  applicant: 'Applied',
  applicants: 'Applied',
  application: 'Applied',
  new: 'Applied',
  screening: 'Screening',
  screen: 'Screening',
  screener: 'Screening',
  interview: 'Interview',
  interviewing: 'Interview',
  interviews: 'Interview',
  offer: 'Offer',
  offered: 'Offer',
  offers: 'Offer',
  hired: 'Hired',
  hire: 'Hired',
  hires: 'Hired',
  accepted: 'Hired',
  rejected: 'Rejected',
  reject: 'Rejected',
  declined: 'Rejected',
};

/**
 * Natural Language Query Parser
 */
export function parseRecruiterQuery(rawQuery: string, referenceDate: Date = new Date()): ParsedSearchQuery {
  const query = rawQuery.trim();
  const lowerQuery = query.toLowerCase();

  const parsed: ParsedSearchQuery = {
    rawQuery: query,
    hasFilters: false,
    filters: {},
    explanation: {
      summary: '',
      detectedIntents: [],
      unrecognizedTokens: [],
      suggestions: [],
    },
  };

  if (!query) {
    parsed.explanation.summary = 'Showing all candidates across all stages.';
    return parsed;
  }

  let residualText = lowerQuery;

  // 1. Exclusion filter: "except rejected", "not rejected", "excluding rejected"
  if (
    residualText.includes('except rejected') ||
    residualText.includes('excluding rejected') ||
    residualText.includes('not rejected') ||
    residualText.includes('without rejected') ||
    residualText.includes('non-rejected')
  ) {
    parsed.filters.excludeRejected = true;
    parsed.hasFilters = true;
    parsed.explanation.detectedIntents.push('Excluding rejected candidates (Active & Hired only)');
    residualText = residualText
      .replace(/\b(everyone|all|candidates?)?\s*(except|excluding|without|not)\s+rejected\s*(candidates?)?\b/gi, ' ')
      .trim();
  }

  // 2. Milestone Filter: "reached the offer stage but didn't get hired" / "reached offer but not hired"
  const reachedNotHiredRegex = /reached\s+(?:the\s+)?(offer|interview|screening)\s+(?:stage\s+)?but\s+(?:didn't|did\s+not|never|wasn't|was\s+not)\s+(?:get\s+)?hired/i;
  const reachedMatch = residualText.match(reachedNotHiredRegex);
  if (reachedMatch) {
    const rawStage = reachedMatch[1].toLowerCase();
    const stage = STAGE_SYNONYMS[rawStage] as PipelineStage;
    if (stage) {
      parsed.filters.reachedStageNotHired = { reachedStage: stage };
      parsed.hasFilters = true;
      parsed.explanation.detectedIntents.push(`Reached ${stage} stage in history, but outcome is not Hired`);
      residualText = residualText.replace(reachedMatch[0], ' ').trim();
    }
  }

  // 3. Duration Filter: "stuck in screening for more than a week" / "stuck in interview > 3 days"
  const stuckRegex = /(?:stuck|lingering|waiting|idle|delayed|longer)\s+(?:in\s+)?(screening|interview|applied|offer)\s+(?:for\s+)?(?:more\s+than|longer\s+than|>|over)?\s*(\d+|a|an|one)?\s*(week|weeks|day|days|month|months)/i;
  const stuckMatch = residualText.match(stuckRegex);
  if (stuckMatch) {
    const rawStage = stuckMatch[1].toLowerCase();
    const stage = STAGE_SYNONYMS[rawStage] as PipelineStage;
    const count = stuckMatch[2] && !isNaN(parseInt(stuckMatch[2], 10)) ? parseInt(stuckMatch[2], 10) : 1;
    const unit = stuckMatch[3].toLowerCase();

    let days = count;
    if (unit.startsWith('week')) days = count * 7;
    else if (unit.startsWith('month')) days = count * 30;

    if (stage) {
      parsed.filters.stuckInStage = { stage, minDays: days };
      parsed.hasFilters = true;
      parsed.explanation.detectedIntents.push(`Stuck in ${stage} for more than ${days} days (${count} ${unit})`);
      residualText = residualText.replace(stuckMatch[0], ' ').trim();
    }
  }

  // 4. Transition Recency: "moved to interview since monday" / "advanced to screening since friday"
  const movedSinceRegex = /(?:moved|transited|advanced|progressed|promoted|entered)\s+(?:to\s+)?(applied|screening|interview|offer|hired)\s+since\s+([a-zA-Z]+)/i;
  const movedMatch = residualText.match(movedSinceRegex);
  if (movedMatch) {
    const rawStage = movedMatch[1].toLowerCase();
    const stage = STAGE_SYNONYMS[rawStage] as PipelineStage;
    const dayStr = movedMatch[2].toLowerCase();
    const resolvedDate = resolveDayOfWeek(dayStr, referenceDate);

    if (stage) {
      const formattedDate = resolvedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      parsed.filters.movedToStageSince = {
        stage,
        sinceDate: resolvedDate,
        sinceDescription: `${dayStr.charAt(0).toUpperCase() + dayStr.slice(1)} (${formattedDate})`,
      };
      parsed.hasFilters = true;
      parsed.explanation.detectedIntents.push(`Moved to ${stage} since ${dayStr} (${formattedDate})`);
      residualText = residualText.replace(movedMatch[0], ' ').trim();
    }
  }

  // 5. Current Stage Query: "who's in interview right now" / "at interview stage" / "in screening"
  const currentStageRegex = /(?:in|at|under|currently\s+in)\s+(applied|screening|interview|offer|hired|rejected)(?:\s+(?:stage|right\s+now|currently))?/i;
  const currentStageMatch = residualText.match(currentStageRegex);
  if (currentStageMatch && !parsed.filters.stuckInStage && !parsed.filters.movedToStageSince) {
    const rawStage = currentStageMatch[1].toLowerCase();
    const stage = STAGE_SYNONYMS[rawStage];
    if (stage) {
      parsed.filters.stage = stage;
      parsed.hasFilters = true;
      parsed.explanation.detectedIntents.push(`Currently at stage: ${stage}`);
      residualText = residualText.replace(currentStageMatch[0], ' ').trim();
    }
  } else if (!parsed.filters.stage && !parsed.filters.stuckInStage && !parsed.filters.movedToStageSince) {
    // Check if query is just a single stage name (e.g. "interview" or "screening")
    for (const [key, stage] of Object.entries(STAGE_SYNONYMS)) {
      const wordRegex = new RegExp(`\\b${key}\\b`, 'i');
      if (wordRegex.test(residualText)) {
        parsed.filters.stage = stage;
        parsed.hasFilters = true;
        parsed.explanation.detectedIntents.push(`Stage: ${stage}`);
        residualText = residualText.replace(wordRegex, ' ').trim();
        break;
      }
    }
  }

  // Clean remaining text of filler words to find name queries
  const potentialName = cleanConversationalPrefixes(residualText)
    .replace(/\b(right now|currently|since|for|more than|a week|days?|weeks?|stage|interview|screening|applied|offer|hired|rejected)\b/gi, ' ')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // A valid candidate name/keyword query should have at least 2 alphanumeric characters
  if (potentialName.length >= 2) {
    parsed.filters.nameQuery = potentialName;
    parsed.filters.fuzzyNameMatch = true;
    parsed.hasFilters = true;
    parsed.explanation.detectedIntents.push(`Name / Keyword: "${potentialName}" (fuzzy enabled)`);
  }

  // Build high-level summary
  if (parsed.explanation.detectedIntents.length > 0) {
    parsed.explanation.summary = `Filters applied: ${parsed.explanation.detectedIntents.join(' • ')}`;
  } else {
    parsed.explanation.summary = `Searching candidate profiles for "${query}"`;
  }

  return parsed;
}

/**
 * Evaluates candidates against a parsed query and scores them for ranking
 */
export function searchAndRankCandidates(
  candidates: readonly Candidate[],
  parsedQuery: ParsedSearchQuery,
  referenceDate: Date = new Date()
): {
  results: ScoredCandidate[];
  explanation: ParsedSearchQuery['explanation'];
} {
  const { filters, rawQuery } = parsedQuery;
  const explanation = { ...parsedQuery.explanation };

  if (!rawQuery.trim()) {
    // Empty query returns all candidates in default order
    const unscored = candidates.map((c) => ({
      candidate: c,
      score: 100,
      matchReasons: ['All candidates'],
      isMatch: true,
    }));
    return { results: unscored, explanation };
  }

  const scored: ScoredCandidate[] = [];

  for (const candidate of candidates) {
    let score = 0;
    let isMatch = true;
    const matchReasons: string[] = [];

    // 1. Exclusion: except rejected
    if (filters.excludeRejected) {
      if (candidate.status === 'REJECTED' || candidate.currentStage === 'Rejected') {
        isMatch = false;
      } else {
        score += 20;
        matchReasons.push('Active / Non-rejected candidate');
      }
    }

    // 2. Current stage filter
    if (filters.stage && isMatch) {
      if (candidate.currentStage === filters.stage) {
        score += 50;
        matchReasons.push(`In ${filters.stage} right now`);
      } else {
        isMatch = false;
      }
    }

    // 3. Stuck in stage for > N days
    if (filters.stuckInStage && isMatch) {
      if (candidate.currentStage !== filters.stuckInStage.stage) {
        isMatch = false;
      } else {
        const enteredTime = new Date(candidate.stageEnteredAt).getTime();
        const elapsedDays = Math.floor((referenceDate.getTime() - enteredTime) / (1000 * 60 * 60 * 24));
        if (elapsedDays >= filters.stuckInStage.minDays) {
          score += 60 + elapsedDays; // Longer stalled candidates ranked higher
          matchReasons.push(`Stuck in ${filters.stuckInStage.stage} for ${elapsedDays} days`);
        } else {
          isMatch = false;
        }
      }
    }

    // 4. Moved to stage since date
    if (filters.movedToStageSince && isMatch) {
      const targetStage = filters.movedToStageSince.stage;
      const sinceTime = filters.movedToStageSince.sinceDate.getTime();

      // Look through candidate's immutable audit log for transitions to target stage
      const transition = candidate.auditTrail.find(
        (entry) =>
          entry.toStage === targetStage &&
          entry.action === 'STAGE_TRANSITION' &&
          new Date(entry.timestamp).getTime() >= sinceTime
      );

      if (transition) {
        score += 60;
        const transitionDate = new Date(transition.timestamp).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        matchReasons.push(`Advanced to ${targetStage} on ${transitionDate}`);
      } else {
        isMatch = false;
      }
    }

    // 5. Reached stage but didn't get hired
    if (filters.reachedStageNotHired && isMatch) {
      const targetStage = filters.reachedStageNotHired.reachedStage;
      const reachedStageInHistory = candidate.auditTrail.some((entry) => entry.toStage === targetStage);
      const isNotHired = candidate.status === 'REJECTED' || candidate.currentStage !== 'Hired';

      if (reachedStageInHistory && isNotHired) {
        score += 65;
        matchReasons.push(`Reached ${targetStage} but final outcome was not Hired (${candidate.status})`);
      } else {
        isMatch = false;
      }
    }

    // 6. Name / Keyword fuzzy search
    if (filters.nameQuery && isMatch) {
      const fuzzyResult = evaluateFuzzyNameMatch(candidate.name, filters.nameQuery);
      if (fuzzyResult.matches) {
        // Scaled score based on similarity (0.60 to 1.0 -> 30 to 70 points)
        const nameScore = Math.round(fuzzyResult.score * 70);
        score += nameScore;
        if (fuzzyResult.score >= 0.9) {
          matchReasons.push(`Name matched: "${candidate.name}"`);
        } else {
          matchReasons.push(`Fuzzy matched "${filters.nameQuery}" &rarr; "${candidate.name}" (${Math.round(fuzzyResult.score * 100)}% similarity)`);
        }
      } else {
        // Check role or tags for fallback match
        const roleSim = fuzzySimilarity(candidate.role, filters.nameQuery);
        if (roleSim >= 0.6) {
          score += 35;
          matchReasons.push(`Role match: "${candidate.role}"`);
        } else {
          isMatch = false;
        }
      }
    }

    if (isMatch && score > 0) {
      scored.push({
        candidate,
        score,
        matchReasons,
        isMatch: true,
      });
    }
  }

  // Sort descending by score ("the best matches should come first")
  scored.sort((a, b) => b.score - a.score);

  // If 0 matches, formulate helpful explanation of WHY
  if (scored.length === 0 && rawQuery.trim()) {
    explanation.suggestions = [
      'Find Priya Sharma (or type "sharam")',
      "Who's in Interview right now?",
      'Who has been stuck in Screening for more than a week?',
      'Who moved to Interview since Monday?',
      "Who reached the Offer stage but didn't get hired?",
      'Everyone except rejected candidates',
    ];

    if (filters.stuckInStage) {
      const candidatesInStage = candidates.filter((c) => c.currentStage === filters.stuckInStage?.stage);
      explanation.summary = `0 candidates found stuck in ${filters.stuckInStage.stage} for > ${filters.stuckInStage.minDays} days. (There are currently ${candidatesInStage.length} candidate(s) in ${filters.stuckInStage.stage}).`;
    } else if (filters.movedToStageSince) {
      explanation.summary = `0 candidates transitioned to ${filters.movedToStageSince.stage} since ${filters.movedToStageSince.sinceDescription}.`;
    } else if (filters.reachedStageNotHired) {
      explanation.summary = `0 candidates reached ${filters.reachedStageNotHired.reachedStage} and were subsequently not hired.`;
    } else if (filters.nameQuery) {
      explanation.summary = `No candidates found matching name or keyword "${filters.nameQuery}". Check spelling or try a stage filter.`;
    } else {
      explanation.summary = `No candidates matched the combined criteria. Try broadening your query.`;
    }
  }

  return { results: scored, explanation };
}
