import type { CivicReport, ReportStatus } from '../../core/models';
import { SEED_REPORTS } from '../../data/seed';
import { duplicateScore, titleSimilarity } from '../../lib/text-similarity';

export const REPORTS_STORAGE_V2 = 'civic-alert-reports-v2';
export const REPORTS_STORAGE_V1 = 'civic-alert-reports-v1';

const REPORT_STATUSES: ReportStatus[] = [
  'open',
  'triaged',
  'in_progress',
  'resolved',
  'hidden',
  'duplicate'
];

export function sortReports(list: CivicReport[]): CivicReport[] {
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function coerceStatus(v: unknown): ReportStatus {
  return REPORT_STATUSES.includes(v as ReportStatus) ? (v as ReportStatus) : 'open';
}

export function normalizeReport(raw: unknown): CivicReport {
  const r = raw as Record<string, unknown>;
  const id = String(r['id'] ?? '');
  const oldFlagCount = typeof r['flagCount'] === 'number' ? r['flagCount'] : 0;
  let inappropriateFlagUserIds: string[] = Array.isArray(
    r['inappropriateFlagUserIds']
  )
    ? (r['inappropriateFlagUserIds'] as unknown[]).map(String)
    : [];
  if (inappropriateFlagUserIds.length === 0 && oldFlagCount > 0) {
    inappropriateFlagUserIds = Array.from(
      { length: oldFlagCount },
      (_, i) => `legacy:${id}:${i}`
    );
  }
  const supportUserIds = Array.isArray(r['supportUserIds'])
    ? (r['supportUserIds'] as unknown[]).map(String)
    : [];
  const dup = r['duplicateOfId'];
  const note = r['moderatorNote'];
  return {
    id,
    title: String(r['title'] ?? ''),
    body: String(r['body'] ?? ''),
    category: String(r['category'] ?? 'Other'),
    locationLabel: String(r['locationLabel'] ?? ''),
    authorId: String(r['authorId'] ?? ''),
    createdAt: String(r['createdAt'] ?? new Date().toISOString()),
    lastUpdatedAt: String(
      r['lastUpdatedAt'] ?? r['createdAt'] ?? new Date().toISOString()
    ),
    status: coerceStatus(r['status']),
    supportUserIds,
    inappropriateFlagUserIds,
    duplicateOfId: dup == null || dup === '' ? null : String(dup),
    moderatorNote: note == null || note === '' ? null : String(note)
  };
}

export function parseReportsJson(json: string): CivicReport[] {
  try {
    const data: unknown = JSON.parse(json);
    const rows = Array.isArray(data)
      ? data
      : (data as { reports?: unknown }).reports;
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => normalizeReport(row));
  } catch {
    return [];
  }
}

export function seedReportsSnapshot(): CivicReport[] {
  return sortReports(SEED_REPORTS.map((r) => ({ ...r })));
}

export function findPotentialDuplicates(
  items: CivicReport[],
  reportId: string,
  minScore = 0.42
): { id: string; score: number }[] {
  const target = items.find((r) => r.id === reportId);
  if (!target || target.status === 'duplicate' || target.status === 'hidden') {
    return [];
  }
  const out: { id: string; score: number }[] = [];
  for (const r of items) {
    if (r.id === reportId || r.status === 'duplicate' || r.status === 'hidden')
      continue;
    if (r.status === 'resolved') continue;
    const score = duplicateScore(
      target.title,
      target.locationLabel,
      r.title,
      r.locationLabel
    );
    const tOnly = titleSimilarity(target.title, r.title);
    const effective = Math.max(score, tOnly);
    if (effective >= minScore || tOnly >= 0.58) {
      out.push({ id: r.id, score: effective });
    }
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

export function moderationPriority(
  items: CivicReport[],
  r: CivicReport
): number {
  let p = 0;
  p += r.inappropriateFlagUserIds.length * 10;
  if (r.status === 'triaged') p += 5;
  p += findPotentialDuplicates(items, r.id).length * 3;
  return p;
}

export function publicReportsFrom(items: CivicReport[]): CivicReport[] {
  return items.filter(
    (r) => r.status !== 'hidden' && r.status !== 'duplicate'
  );
}

export function moderationQueueFrom(items: CivicReport[]): CivicReport[] {
  const all = items.filter((r) => r.status !== 'hidden');
  const rows = all.filter((r) => {
    if (r.status === 'duplicate') return false;
    if (r.inappropriateFlagUserIds.length > 0) return true;
    if (r.status === 'triaged') return true;
    const dupes = findPotentialDuplicates(items, r.id);
    return dupes.length > 0 && r.status === 'open';
  });
  return [...rows].sort((a, b) => {
    const pa = moderationPriority(items, a);
    const pb = moderationPriority(items, b);
    if (pb !== pa) return pb - pa;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function supportsCount(r: CivicReport): number {
  return r.supportUserIds.length;
}

export function userSupports(r: CivicReport, userId: string): boolean {
  return r.supportUserIds.includes(userId);
}

export function inappropriateFlagCount(r: CivicReport): number {
  return r.inappropriateFlagUserIds.length;
}

export function reportsAuthoredBy(
  items: CivicReport[],
  authorId: string
): CivicReport[] {
  return sortReports(items.filter((r) => r.authorId === authorId));
}
