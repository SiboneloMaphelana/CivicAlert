import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { AppNoticeService } from '../../core/app-notice.service';
import type { CivicReport, User } from '../../core/models';
import { citizenStatusLabel } from '../../lib/report-status-label';
import { AccountFacade } from '../../state/account/account.facade';
import { ReportsFacade } from '../../state/reports/reports.facade';
import { findPotentialDuplicates } from '../../state/reports/reports.helpers';

type DetailVm =
  | { kind: 'notfound' }
  | { kind: 'hidden' }
  | { kind: 'ok'; report: CivicReport; primary: CivicReport | null };

@Component({
  standalone: true,
  selector: 'app-report-detail',
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './report-detail.component.html'
})
export class ReportDetailComponent {
  readonly reports = inject(ReportsFacade);
  readonly account = inject(AccountFacade);
  readonly notices = inject(AppNoticeService);
  readonly citizenStatusLabel = citizenStatusLabel;

  private readonly route = inject(ActivatedRoute);
  private readonly paramId = toSignal(
    this.route.paramMap.pipe(map((m) => m.get('id'))),
    { initialValue: null }
  );
  readonly items = toSignal(this.reports.items$, {
    initialValue: [] as CivicReport[]
  });
  readonly me = toSignal(this.account.currentUser$, {
    initialValue: null as User | null
  });
  readonly isModerator = toSignal(this.account.isModerator$, {
    initialValue: false
  });

  readonly vm = computed((): DetailVm => {
    const id = this.paramId();
    if (!id) return { kind: 'notfound' };
    const r = this.items().find((x) => x.id === id);
    if (!r) return { kind: 'notfound' };
    const mod = this.isModerator();
    const viewerId = this.me()?.id ?? null;
    const isAuthor = viewerId != null && r.authorId === viewerId;
    if (r.status === 'hidden' && !mod && !isAuthor) return { kind: 'hidden' };
    const primary =
      r.duplicateOfId != null
        ? this.items().find((x) => x.id === r.duplicateOfId) ?? null
        : null;
    return { kind: 'ok', report: r, primary };
  });

  readonly similar = computed(() => {
    const v = this.vm();
    if (v.kind !== 'ok') return [];
    if (v.report.status === 'duplicate') return [];
    return findPotentialDuplicates(this.items(), v.report.id).slice(0, 6);
  });

  authorName(id: string): string {
    return this.account.getUserById(id)?.name ?? id;
  }

  titleForReport(id: string): string {
    return this.items().find((r) => r.id === id)?.title ?? id;
  }

  toggleSupport(reportId: string, userId: string): void {
    const result = this.reports.toggleSupport(reportId, userId);
    if (!result.ok) {
      this.notices.error(result.message);
      return;
    }
    if (result.message) {
      this.notices.success(result.message);
    }
  }

  flag(reportId: string, userId: string): void {
    const ok = window.confirm(
      'Flag for moderators (spam, safety, wrong category)?'
    );
    if (!ok) return;
    const r = this.items().find((x) => x.id === reportId);
    if (!r) {
      this.notices.error('That report could not be found.');
      return;
    }
    const result = this.reports.flagInappropriate(reportId, userId);
    if (!result.ok) {
      this.notices.error(result.message);
      return;
    }
    if (result.message) {
      this.notices.success(result.message);
    }
  }

  protected statusChip(status: string): string {
    const base =
      'rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide';
    const map: Record<string, string> = {
      open: `${base} bg-[color:var(--st-open-bg)] text-[color:var(--st-open-fg)]`,
      triaged: `${base} bg-[color:var(--st-triaged-bg)] text-[color:var(--st-triaged-fg)]`,
      in_progress: `${base} bg-[color:var(--st-progress-bg)] text-[color:var(--st-progress-fg)]`,
      resolved: `${base} bg-[color:var(--st-resolved-bg)] text-[color:var(--st-resolved-fg)]`,
      hidden: `${base} bg-[color:var(--st-hidden-bg)] text-[color:var(--st-hidden-fg)]`,
      duplicate: `${base} bg-[color:var(--st-dup-bg)] text-[color:var(--st-dup-fg)]`
    };
    return (
      map[status] ??
      `${base} bg-[color:var(--st-hidden-bg)] text-[color:var(--st-hidden-fg)]`
    );
  }
}
