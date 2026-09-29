/**
 * Time, Date, and Cryptographic Audit Utilities
 */

/**
 * Computes a deterministic pseudo-SHA256 signature for audit immutability verification.
 * In a production backend, this would use HMAC/SHA256 with a private key.
 */
export function generateAuditSignature(entry: {
  candidateId: string;
  timestamp: string;
  action: string;
  fromStage?: string | null;
  toStage: string;
  actor: string;
}): string {
  const payload = `${entry.candidateId}|${entry.timestamp}|${entry.action}|${entry.fromStage ?? 'NONE'}|${entry.toStage}|${entry.actor}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const salt = Math.abs((hash * 31) | 0).toString(16).padStart(8, '0');
  return `sha256:aud_${hex}${salt}`;
}

/**
 * Calculates how long a candidate has been in their current stage.
 * Returns human-readable elapsed duration and raw days/hours.
 */
export function getStageDuration(stageEnteredAtISO: string, now: Date = new Date()): {
  formatted: string;
  days: number;
  hours: number;
  totalMs: number;
  isStalled: boolean; // Flagged if stalled for >= 7 days
} {
  const enteredTime = new Date(stageEnteredAtISO).getTime();
  const currentTime = now.getTime();
  const totalMs = Math.max(0, currentTime - enteredTime);

  const totalMinutes = Math.floor(totalMs / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  let formatted = '';
  if (days > 0) {
    formatted = `${days} day${days > 1 ? 's' : ''}${hours > 0 ? `, ${hours} hr${hours > 1 ? 's' : ''}` : ''}`;
  } else if (hours > 0) {
    formatted = `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (totalMinutes > 0) {
    formatted = `${totalMinutes} minute${totalMinutes > 1 ? 's' : ''}`;
  } else {
    formatted = 'Just entered';
  }

  // A candidate is considered stalled if they have been in stage for 7 or more days
  const isStalled = days >= 7;

  return { formatted, days, hours, totalMs, isStalled };
}

/**
 * Returns formatted date and time for audit records
 */
export function formatAuditTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Returns relative time string like "3 days ago", "Yesterday", etc.
 */
export function getRelativeTimeString(isoString: string, now: Date = new Date()): string {
  const timestamp = new Date(isoString).getTime();
  const diffMs = now.getTime() - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

/**
 * Resolves day-of-week references (e.g. "Monday", "Friday") to the most recent preceding calendar day
 * relative to a reference date.
 */
export function resolveDayOfWeek(dayName: string, referenceDate: Date = new Date()): Date {
  const daysMap: Record<string, number> = {
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  };

  const targetDay = daysMap[dayName.toLowerCase()];
  if (targetDay === undefined) {
    // Default to last 7 days if day name not recognized
    const fallback = new Date(referenceDate);
    fallback.setDate(fallback.getDate() - 7);
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }

  const result = new Date(referenceDate);
  const currentDay = result.getDay();

  let daysBack = (currentDay - targetDay + 7) % 7;
  // If target day is today, resolve to today's midnight or previous week depending on intent
  if (daysBack === 0) {
    daysBack = 7; // Previous week's day
  }

  result.setDate(result.getDate() - daysBack);
  result.setHours(0, 0, 0, 0);
  return result;
}
