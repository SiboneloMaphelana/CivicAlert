import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Observable } from 'rxjs';
import type { ActionResult } from '../../core/action-result';
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
  // Keep a synchronous snapshot for validation before dispatching state changes.
  private readonly items = this.store.selectSignal(selectReportItems);

  readonly items$: Observable<CivicReport[]> =
    this.store.select(selectReportItems);
  readonly publicReports$: Observable<CivicReport[]> =
    this.store.select(selectPublicReports);
  readonly moderationQueue$: Observable<CivicReport[]> =
    this.store.select(selectModerationQueue);

  toggleSupport(reportId: string, userId: string): ActionResult {
    // Validate first so the UI can explain why an action was blocked.
    const report = this.items().find((x) => x.id === reportId);
    if (!report) {
      return { ok: false, message: 'That report could not be found.' };
    }
    if (!['open', 'triaged', 'in_progress'].includes(report.status)) {
      return {
        ok: false,
        message:
          'This report is no longer open for new support. Try the active issue list instead.'
      };
    }
    this.store.dispatch(ReportsActions.toggleSupport({ reportId, userId }));
    const supported = !report.supportUserIds.includes(userId);
    return {
      ok: true,
      message: supported
        ? 'Your “same issue” support was added.'
        : 'Your “same issue” support was removed.'
    };
  }

  flagInappropriate(reportId: string, userId: string): ActionResult {
    const report = this.items().find((x) => x.id === reportId);
    if (!report) {
      return { ok: false, message: 'That report could not be found.' };
    }
    if (report.status === 'hidden' || report.status === 'duplicate') {
      return {
        ok: false,
        message: 'This report cannot be flagged in its current state.'
      };
    }
    if (report.authorId === userId) {
      return {
        ok: false,
        message: 'You cannot flag your own report.'
      };
    }
    if (report.inappropriateFlagUserIds.includes(userId)) {
      return {
        ok: false,
        message: 'You already flagged this report for moderator review.'
      };
    }
    this.store.dispatch(
      ReportsActions.flagInappropriate({ reportId, userId })
    );
    return {
      ok: true,
      message: 'Thanks. Moderators were notified to review this report.'
    };
  }

  setStatus(
    reportId: string,
    status: ReportStatus,
    note?: string | null
  ): ActionResult {
    const report = this.items().find((x) => x.id === reportId);
    if (!report) {
      return { ok: false, message: 'That report could not be found.' };
    }
    if (report.status === status) {
      return {
        ok: false,
        message: `This report is already marked ${status.replace('_', ' ')}.`
      };
    }
    this.store.dispatch(
      ReportsActions.setStatus({ reportId, status, note })
    );
    // Convert enum-like values into readable copy for the UI.
    return {
      ok: true,
      message: `Report updated to ${status.replace('_', ' ')}.`
    };
  }

  hideReport(reportId: string, note?: string): ActionResult {
    const report = this.items().find((x) => x.id === reportId);
    if (!report) {
      return { ok: false, message: 'That report could not be found.' };
    }
    if (report.status === 'hidden') {
      return {
        ok: false,
        message: 'This report is already removed from the public list.'
      };
    }
    this.store.dispatch(ReportsActions.hideReport({ reportId, note }));
    return {
      ok: true,
      message: 'The report was removed from the public list.'
    };
  }

  markDuplicate(
    reportId: string,
    primaryId: string,
    note?: string
  ): ActionResult {
    const items = this.items();
    const report = items.find((x) => x.id === reportId);
    const primary = items.find((x) => x.id === primaryId);
    if (!report) {
      return { ok: false, message: 'That report could not be found.' };
    }
    if (reportId === primaryId) {
      return {
        ok: false,
        message: 'A report cannot be merged into itself.'
      };
    }
    if (!primary) {
      return {
        ok: false,
        message: `Primary report ${primaryId} was not found.`
      };
    }
    if (primary.status === 'hidden' || primary.status === 'duplicate') {
      return {
        ok: false,
        message: 'Choose an active primary report before merging.'
      };
    }
    this.store.dispatch(
      ReportsActions.markDuplicate({ reportId, primaryId, note })
    );
    return {
      ok: true,
      message: `Merged into primary thread ${primaryId}.`
    };
  }

  duplicateReportAsNew(reportId: string, authorId: string): ActionResult<string> {
    const report = this.items().find((x) => x.id === reportId);
    if (!report) {
      return { ok: false, message: 'That report could not be found.' };
    }
    // The generated id is returned so callers can navigate to the new thread immediately.
    const newId = `r-${Date.now().toString(36)}`;
    this.store.dispatch(
      ReportsActions.duplicateAsNew({ reportId, authorId, newId })
    );
    return {
      ok: true,
      message: 'A follow-up report was created.',
      data: newId
    };
  }

  addReport(
    draft: Pick<
      CivicReport,
      'title' | 'body' | 'category' | 'locationLabel' | 'authorId'
    >
  ): ActionResult<string> {
    if (!draft.authorId) {
      return {
        ok: false,
        message: 'Sign in before filing a report.'
      };
    }
    // Reports are stored client-side in this demo, so we create the id up front.
    const id = `r-${Date.now().toString(36)}`;
    this.store.dispatch(ReportsActions.addReport({ id, draft }));
    return {
      ok: true,
      message: 'Report submitted successfully.',
      data: id
    };
  }

  resetToSeed(): ActionResult {
    if (typeof localStorage !== 'undefined') {
      try {
        // Remove older persisted data before restoring the bundled sample dataset.
        localStorage.removeItem(REPORTS_STORAGE_V1);
      } catch {
        return {
          ok: false,
          message:
            'The app could not clear saved local data. Check browser storage settings and try again.'
        };
      }
    }
    this.store.dispatch(ReportsActions.resetToSeed());
    return {
      ok: true,
      message: 'Demo reports were reset to the original sample data.'
    };
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
    // Expose duplicate scoring through the facade so components stay presentation-focused.
    return findPotentialDuplicates(items, reportId, minScore);
  }
}
