import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Observable } from 'rxjs';
import type { CivicReport, ReportStatus } from '../../core/models';
import type { AppState } from '../app.reducer';
import { ReportsActions } from './reports.actions';
import {
  findPotentialDuplicates,
  inappropriateFlagCount,
  REPORTS_STORAGE_V1,
  supportsCount,
  userSupports
} from './reports.helpers';
import {
  selectModerationQueue,
  selectPublicReports,
  selectReportItems
} from './reports.selectors';

@Injectable({ providedIn: 'root' })
export class ReportsFacade {
  private readonly store = inject(Store<AppState>);

  readonly items$: Observable<CivicReport[]> =
    this.store.select(selectReportItems);
  readonly publicReports$: Observable<CivicReport[]> =
    this.store.select(selectPublicReports);
  readonly moderationQueue$: Observable<CivicReport[]> =
    this.store.select(selectModerationQueue);

  toggleSupport(reportId: string, userId: string): void {
    this.store.dispatch(ReportsActions.toggleSupport({ reportId, userId }));
  }

  flagInappropriate(reportId: string, userId: string): void {
    this.store.dispatch(
      ReportsActions.flagInappropriate({ reportId, userId })
    );
  }

  setStatus(
    reportId: string,
    status: ReportStatus,
    note?: string | null
  ): void {
    this.store.dispatch(
      ReportsActions.setStatus({ reportId, status, note })
    );
  }

  hideReport(reportId: string, note?: string): void {
    this.store.dispatch(ReportsActions.hideReport({ reportId, note }));
  }

  markDuplicate(
    reportId: string,
    primaryId: string,
    note?: string
  ): void {
    this.store.dispatch(
      ReportsActions.markDuplicate({ reportId, primaryId, note })
    );
  }

  duplicateReportAsNew(reportId: string, authorId: string): string {
    const newId = `r-${Date.now().toString(36)}`;
    this.store.dispatch(
      ReportsActions.duplicateAsNew({ reportId, authorId, newId })
    );
    return newId;
  }

  addReport(
    draft: Pick<
      CivicReport,
      'title' | 'body' | 'category' | 'locationLabel' | 'authorId'
    >
  ): string {
    const id = `r-${Date.now().toString(36)}`;
    this.store.dispatch(ReportsActions.addReport({ id, draft }));
    return id;
  }

  resetToSeed(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(REPORTS_STORAGE_V1);
    }
    this.store.dispatch(ReportsActions.resetToSeed());
  }

  supportsCount(report: CivicReport): number {
    return supportsCount(report);
  }

  userSupports(report: CivicReport, userId: string): boolean {
    return userSupports(report, userId);
  }

  inappropriateFlagCount(report: CivicReport): number {
    return inappropriateFlagCount(report);
  }

  potentialDuplicates(
    items: CivicReport[],
    reportId: string,
    minScore = 0.42
  ): { id: string; score: number }[] {
    return findPotentialDuplicates(items, reportId, minScore);
  }

}
