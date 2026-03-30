import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppNoticeService } from '../../core/app-notice.service';
import type { CivicReport, ReportStatus, User } from '../../core/models';
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
  readonly notices = inject(AppNoticeService);
  readonly citizenStatusLabel = citizenStatusLabel;

  readonly queue = toSignal(this.reports.moderationQueue$, {
    initialValue: [] as CivicReport[]
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
    if (!primary) {
      this.notices.error('Enter a primary report ID before merging.');
      return;
    }
    if (
      !window.confirm(
        'Merge this report into the primary thread? Residents will only see one issue.'
      )
    ) {
      return;
    }
    const result = this.reports.markDuplicate(reportId, primary);
    if (!result.ok) {
      this.notices.error(result.message);
      return;
    }
    this.customPrimary[reportId] = '';
    if (result.message) {
      this.notices.success(result.message);
    }
  }

  fork(reportId: string): void {
    const u = this.me();
    if (!u) {
      this.notices.error('Sign in as a moderator before creating a follow-up report.');
      return;
    }
    if (
      !window.confirm(
        'Create a new open report with this content for a separate work order?'
      )
    ) {
      return;
    }
    const result = this.reports.duplicateReportAsNew(reportId, u.id);
    if (!result.ok) {
      this.notices.error(result.message);
      return;
    }
    if (result.message) {
      this.notices.success(result.message);
    }
  }

  hide(reportId: string): void {
    if (
      !window.confirm(
        'Remove this from the public issues list? Moderators can still open it by ID.'
      )
    ) {
      return;
    }
    const result = this.reports.hideReport(reportId);
    if (!result.ok) {
      this.notices.error(result.message);
      return;
    }
    if (result.message) {
      this.notices.success(result.message);
    }
  }

  setStatus(reportId: string, status: ReportStatus, note?: string): void {
    const result = this.reports.setStatus(reportId, status, note);
    if (!result.ok) {
      this.notices.error(result.message);
      return;
    }
    if (result.message) {
      this.notices.success(result.message);
    }
  }
}
