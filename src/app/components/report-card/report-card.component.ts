import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppNoticeService } from '../../core/app-notice.service';
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
  protected readonly notices = inject(AppNoticeService);

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
    const result = this.reports.toggleSupport(this.report().id, userId);
    if (!result.ok) {
      this.notices.error(result.message);
      return;
    }
    if (result.message) {
      this.notices.success(result.message);
    }
  }

  protected onFlag(userId: string): void {
    const ok = window.confirm(
      'Flag this report for moderators? Use this for spam, safety concerns, or off-topic posts—not for disagreeing with a neighbor.'
    );
    if (!ok) return;
    const r = this.report();
    const result = this.reports.flagInappropriate(r.id, userId);
    if (!result.ok) {
      this.notices.error(result.message);
      return;
    }
    if (result.message) {
      this.notices.success(result.message);
    }
  }

  protected statusClass(): string {
    const s = this.report().status;
    const base =
      'rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide';
    const map: Record<string, string> = {
      open: `${base} bg-[color:var(--st-open-bg)] text-[color:var(--st-open-fg)]`,
      triaged: `${base} bg-[color:var(--st-triaged-bg)] text-[color:var(--st-triaged-fg)]`,
      in_progress: `${base} bg-[color:var(--st-progress-bg)] text-[color:var(--st-progress-fg)]`,
      resolved: `${base} bg-[color:var(--st-resolved-bg)] text-[color:var(--st-resolved-fg)]`,
      hidden: `${base} bg-[color:var(--st-hidden-bg)] text-[color:var(--st-hidden-fg)]`,
      duplicate: `${base} bg-[color:var(--st-dup-bg)] text-[color:var(--st-dup-fg)]`
    };
    return (
      map[s] ??
      `${base} bg-[color:var(--st-hidden-bg)] text-[color:var(--st-hidden-fg)]`
    );
  }
}
