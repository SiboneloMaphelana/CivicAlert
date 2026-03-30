import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
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
    this.reports.toggleSupport(reportId, userId);
  }

  flag(reportId: string, userId: string): void {
    const ok = window.confirm(
      'Flag for moderators (spam, safety, wrong category)?'
    );
    if (!ok) return;
    const r = this.items().find((x) => x.id === reportId);
    if (
      !r ||
      r.authorId === userId ||
      r.inappropriateFlagUserIds.includes(userId)
    ) {
      window.alert('Already flagged or you cannot flag your own report.');
      return;
    }
    this.reports.flagInappropriate(reportId, userId);
  }

  protected statusChip(status: string): string {
    const map: Record<string, string> = {
      open: 'bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200',
      triaged:
        'bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-200',
      in_progress:
        'bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100',
      resolved:
        'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200',
      hidden: 'bg-slate-200 text-slate-700',
      duplicate: 'bg-orange-100 text-orange-950 dark:bg-orange-950/40'
    };
    return map[status] ?? 'bg-slate-100 text-slate-800';
  }
}
