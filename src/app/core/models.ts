export type UserRole = 'citizen' | 'moderator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  ward: string;
  avatarEmoji: string;
  bio: string;
}

export type ReportStatus =
  | 'open'
  | 'triaged'
  | 'in_progress'
  | 'resolved'
  | 'hidden'
  | 'duplicate';

export interface CivicReport {
  id: string;
  title: string;
  body: string;
  category: string;
  locationLabel: string;
  authorId: string;
  createdAt: string;
  lastUpdatedAt: string;
  status: ReportStatus;
  /** Residents who clicked “Same issue” (one per user). */
  supportUserIds: string[];
  /** Unique residents who flagged for moderators (spam, safety, off-topic). */
  inappropriateFlagUserIds: string[];
  duplicateOfId: string | null;
  /** Shown as an official update when present. */
  moderatorNote: string | null;
}
