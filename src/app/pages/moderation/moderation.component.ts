import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { CivicReport, User } from '../../core/models';
import { citizenStatusLabel } from '../../lib/report-status-label';
import { AccountFacade } from '../../state/account/account.facade';
import { ReportsFacade } from '../../state/reports/reports.facade';
import { findPotentialDuplicates } from '../../state/reports/reports.helpers';

@Component({
  standalone: true,
  selector: 'app-moderation',
  imports: [RouterLink, FormsModule, DatePipe],
  templateUrl: './moderation.component.html'
})
export class ModerationComponent {
  readonly reports = inject(ReportsFacade);
  readonly account = inject(AccountFacade);
  readonly citizenStatusLabel = citizenStatusLabel;

  readonly queue = toSignal(this.reports.moderationQueue$, {
    initialValue: [] as CivicReport[]
  });
  readonly isModerator = toSignal(this.account.isModerator$, {
    initialValue: false
  });
  readonly items = toSignal(this.reports.items$, {
    initialValue: [] as CivicReport[]
  });
  readonly me = toSignal(this.account.currentUser$, {
    initialValue: null as User | null
  });

  readonly customPrimary: Record<string, string | undefined> = {};

  dupIds(id: string): string[] {
    return findPotentialDuplicates(this.items(), id).map((x) => x.id);
  }

  shortTitle(id: string): string {
    const t = this.items().find((x) => x.id === id)?.title ?? '';
    return t.length > 48 ? `${t.slice(0, 48)}…` : t;
  }

  markDup(reportId: string, primaryRaw: string | undefined): void {
    const primary = primaryRaw?.trim();
    if (!primary) return;
    if (
      !window.confirm(
        'Merge this report into the primary thread? Residents will only see one issue.'
      )
    ) {
      return;
    }
    this.reports.markDuplicate(reportId, primary);
  }

  fork(reportId: string): void {
    const u = this.me();
    if (!u) return;
    if (
      !window.confirm(
        'Create a new open report with this content for a separate work order?'
      )
    ) {
      return;
    }
    this.reports.duplicateReportAsNew(reportId, u.id);
  }

  hide(reportId: string): void {
    if (
      !window.confirm(
        'Remove this from the public issues list? Moderators can still open it by ID.'
      )
    ) {
      return;
    }
    this.reports.hideReport(reportId);
  }
}
