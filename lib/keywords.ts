/**
 * Keyword Matching Engine
 * Supports AND/OR logic for matching article titles against keyword subscriptions.
 */

export interface KeywordRule {
  text: string;
  logic: 'AND' | 'OR';
}

export interface MatchResult {
  matched: boolean;
  matchedKeywords: string[];
  matchedLogic: 'AND' | 'OR';
}

/**
 * Check if an article title matches a list of keyword rules.
 *
 * Rules:
 * - First keyword is always evaluated alone (no leading AND/OR)
 * - Subsequent keywords use their specified logic:
 *   - AND: article must contain ALL subsequent keywords
 *   - OR: article must contain ANY subsequent keyword
 * - Returns true only if the combined logic is satisfied.
 */
export function matchKeywords(
  articleTitle: string,
  keywords: KeywordRule[]
): MatchResult {
  if (!keywords || keywords.length === 0) {
    return { matched: false, matchedKeywords: [], matchedLogic: 'OR' };
  }

  const title = articleTitle.toLowerCase();
  const filledKeywords = keywords.filter(k => k.text.trim() !== '');

  if (filledKeywords.length === 0) {
    return { matched: false, matchedKeywords: [], matchedLogic: 'OR' };
  }

  // First keyword: always evaluated
  const first = filledKeywords[0].text.trim().toLowerCase();
  const firstMatched = title.includes(first);
  const matched: string[] = firstMatched ? [filledKeywords[0].text.trim()] : [];

  // If only one keyword, check just that one
  if (filledKeywords.length === 1) {
    return {
      matched: firstMatched,
      matchedKeywords: matched,
      matchedLogic: 'OR',
    };
  }

  // For subsequent keywords, apply AND/OR logic from the keyword that precedes them
  // Logic interpretation:
  // - keyword[0] = "台積電"  (no preceding logic, just the first)
  // - keyword[1] = "熊本" (logic: AND → must match AND with previous group)
  // - keyword[2] = "美國" (logic: OR → at least one must match)
  //
  // Simplified interpretation (matching spec):
  // "AND logic: all keywords must match; OR logic: any keyword matches"

  let overallMatched = firstMatched;
  const matchedSet = new Set(matched);

  for (let i = 1; i < filledKeywords.length; i++) {
    const kw = filledKeywords[i].text.trim().toLowerCase();
    const keywordMatched = title.includes(kw);

    if (filledKeywords[i].logic === 'AND') {
      // AND: previous AND current must both match
      overallMatched = overallMatched && keywordMatched;
      if (keywordMatched) matchedSet.add(filledKeywords[i].text.trim());
    } else {
      // OR: at least one must match
      if (keywordMatched) matchedSet.add(filledKeywords[i].text.trim());
      // OR doesn't change overallMatched if first already failed, but if first failed and this matches, it becomes true
      if (!overallMatched && keywordMatched) {
        overallMatched = true;
      }
    }
  }

  return {
    matched: overallMatched,
    matchedKeywords: Array.from(matchedSet),
    matchedLogic: 'OR', // reporting only
  };
}

/**
 * Parse user notification settings stored as JSON string or array.
 */
export function parseNotificationSettings(raw: unknown): {
  notify_line: boolean;
  notify_email: boolean;
  notify_discord: boolean;
  line_token?: string;
  email?: string;
  discord_webhook?: string;
} {
  if (!raw) {
    return { notify_line: false, notify_email: true, notify_discord: false };
  }

  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    return {
      notify_line: Boolean(obj.notify_line),
      notify_email: obj.notify_email !== undefined ? Boolean(obj.notify_email) : true,
      notify_discord: Boolean(obj.notify_discord),
      line_token: typeof obj.line_token === 'string' ? obj.line_token : undefined,
      email: typeof obj.email === 'string' ? obj.email : undefined,
      discord_webhook: typeof obj.discord_webhook === 'string' ? obj.discord_webhook : undefined,
    };
  }

  return { notify_line: false, notify_email: true, notify_discord: false };
}
