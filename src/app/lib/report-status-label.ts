import type { ReportStatus } from '../core/models';

/** Labels shown to residents (not internal moderator jargon). */
export function citizenStatusLabel(status: ReportStatus): string {
  switch (status) {
    case 'open':
      return 'Submitted';
    case 'triaged':
      return 'Acknowledged';
    case 'in_progress':
      return 'In progress';
    case 'resolved':
      return 'Resolved';
    case 'hidden':
      return 'Removed';
    case 'duplicate':
      return 'Merged';
    default:
      return status;
  }
}
