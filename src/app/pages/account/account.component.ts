import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { AppNoticeService } from '../../core/app-notice.service';
import type { CivicReport, User } from '../../core/models';
import { citizenStatusLabel } from '../../lib/report-status-label';
import { AccountFacade } from '../../state/account/account.facade';
import { ReportsFacade } from '../../state/reports/reports.facade';
import { reportsAuthoredBy } from '../../state/reports/reports.helpers';

@Component({
  standalone: true,
  selector: 'app-account',
  imports: [RouterLink, DatePipe],
  templateUrl: './account.component.html'
})
export class AccountComponent {
  readonly account = inject(AccountFacade);
  readonly reports = inject(ReportsFacade);
  readonly notices = inject(AppNoticeService);
  readonly citizenStatusLabel = citizenStatusLabel;

  readonly me = toSignal(this.account.currentUser$, {
    initialValue: null as User | null
  });
  readonly isModerator = toSignal(this.account.isModerator$, {
    initialValue: false
  });
  readonly myReports = toSignal(
    combineLatest({
      uid: this.account.currentUserId$,
      items: this.reports.items$
    }).pipe(
      map(({ uid, items }) => (uid ? reportsAuthoredBy(items, uid) : []))
    ),
    { initialValue: [] as CivicReport[] }
  );

  signOut(): void {
    const result = this.account.signOut();
    if (!result.ok) {
      this.notices.error(result.message);
      return;
    }
    if (result.message) {
      this.notices.success(result.message);
    }
  }

  resetDemoData(): void {
    const result = this.reports.resetToSeed();
    if (!result.ok) {
      this.notices.error(result.message);
      return;
    }
    if (result.message) {
      this.notices.success(result.message);
    }
  }
}
