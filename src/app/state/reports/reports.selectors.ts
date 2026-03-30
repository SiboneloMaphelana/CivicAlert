import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  inappropriateFlagCount,
  moderationQueueFrom,
  publicReportsFrom,
  supportsCount,
  userSupports
} from './reports.helpers';
import type { ReportsState } from './reports.reducer';

export const selectReportsState = createFeatureSelector<ReportsState>('reports');

export const selectReportItems = createSelector(
  selectReportsState,
  (s) => s.items
);

export const selectPublicReports = createSelector(selectReportItems, (items) =>
  publicReportsFrom(items)
);

export const selectModerationQueue = createSelector(selectReportItems, (items) =>
  moderationQueueFrom(items)
);

export const selectReportById = (id: string) =>
  createSelector(selectReportItems, (items) => items.find((r) => r.id === id));

export const reportSupportsCount = supportsCount;
export const reportUserSupports = userSupports;
export const reportInappropriateFlagCount = inappropriateFlagCount;
