import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CivicReport } from '../../core/models';
import { citizenStatusLabel } from '../../lib/report-status-label';
import { ReportsFacade } from '../../state/reports/reports.facade';

export interface DuplicateHint {
  id: string;
  title: string;
  score: number;
}

@Component({
  selector: 'app-report-card',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './report-card.component.html'
})
export class ReportCardComponent {
  protected readonly reports = inject(ReportsFacade);

  readonly report = input.required<CivicReport>();
  readonly authorLabel = input.required<string>();
  readonly duplicateHints = input<DuplicateHint[]>([]);
  readonly showModeratorNote = input(false);
  readonly currentUserId = input<string | null>(null);

  protected modNoteVisible(): boolean {
    const r = this.report();
    if (!r.moderatorNote) return false;
    if (this.showModeratorNote()) return true;
    return (
      r.status === 'resolved' ||
      r.status === 'in_progress' ||
      r.status === 'triaged'
    );
  }

  protected statusLabel(): string {
    return citizenStatusLabel(this.report().status);
  }

  protected onToggleSupport(userId: string): void {
    this.reports.toggleSupport(this.report().id, userId);
  }

  protected onFlag(userId: string): void {
    const ok = window.confirm(
      'Flag this report for moderators? Use this for spam, safety concerns, or off-topic posts—not for disagreeing with a neighbor.'
    );
    if (!ok) return;
    const r = this.report();
    if (
      r.authorId === userId ||
      r.inappropriateFlagUserIds.includes(userId)
    ) {
      window.alert('You already flagged this report, or you cannot flag your own.');
      return;
    }
    this.reports.flagInappropriate(r.id, userId);
  }

  protected statusClass(): string {
    const s = this.report().status;
    const map: Record<string, string> = {
      open:
        'bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200',
      triaged:
        'bg-violet-50 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200',
      in_progress:
        'bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100',
      resolved:
        'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
      hidden: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      duplicate:
        'bg-orange-50 text-orange-900 dark:bg-orange-950/50 dark:text-orange-100'
    };
    return map[s] ?? 'bg-slate-100 text-slate-700';
  }
}
