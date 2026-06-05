export type MatchInput = {
  amount: number;
  timestamp: Date;
  categorySlug?: string | null;
  description?: string | null;
};

export type MatchScore = {
  score: number;
  reason: string;
};

export function scoreExpenseMatch(telegram: MatchInput, mono: MatchInput): MatchScore {
  const reasons: string[] = [];
  let score = 0;

  const amountDiff = Math.abs(telegram.amount - mono.amount);
  if (amountDiff === 0) {
    score += 70;
    reasons.push("exact amount");
  } else if (amountDiff <= 1) {
    score += 45;
    reasons.push("near amount");
  } else if (amountDiff <= 5) {
    score += 25;
    reasons.push("loose amount");
  }

  const dayDiff = Math.abs(daysBetween(telegram.timestamp, mono.timestamp));
  if (dayDiff === 0) {
    score += 25;
    reasons.push("same day");
  } else if (dayDiff === 1) {
    score += 15;
    reasons.push("1 day apart");
  } else if (dayDiff === 2) {
    score += 8;
    reasons.push("2 days apart");
  }

  if (telegram.categorySlug && mono.categorySlug && telegram.categorySlug === mono.categorySlug) {
    score += 10;
    reasons.push("same category");
  }

  const overlap = descriptionWordOverlap(telegram.description, mono.description);
  if (overlap >= 0.5) {
    score += 10;
    reasons.push("similar description");
  } else if (overlap > 0) {
    score += 5;
    reasons.push("partial description match");
  }

  return {
    score: Math.min(score, 100),
    reason: reasons.join(", ") || "weak match",
  };
}

function descriptionWordOverlap(a: string | null | undefined, b: string | null | undefined): number {
  if (!a || !b) return 0;
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const common = [...wordsA].filter((w) => wordsB.has(w)).length;
  return common / Math.max(wordsA.size, wordsB.size);
}

export function daysBetween(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const utcB = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((utcA - utcB) / 86_400_000);
}
