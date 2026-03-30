import { createActionGroup, emptyProps, props } from '@ngrx/store';
import type { CivicReport, ReportStatus } from '../../core/models';

export const ReportsActions = createActionGroup({
  source: 'Reports',
  events: {
    Hydrate: props<{ items: CivicReport[] }>(),
    'Add Report': props<{
      id: string;
      draft: Pick<
        CivicReport,
        'title' | 'body' | 'category' | 'locationLabel' | 'authorId'
      >;
    }>(),
    'Toggle Support': props<{ reportId: string; userId: string }>(),
    'Flag Inappropriate': props<{ reportId: string; userId: string }>(),
    'Set Status': props<{
      reportId: string;
      status: ReportStatus;
      note?: string | null;
    }>(),
    'Hide Report': props<{ reportId: string; note?: string }>(),
    'Restore Report': props<{ reportId: string }>(),
    'Mark Duplicate': props<{
      reportId: string;
      primaryId: string;
      note?: string;
    }>(),
    'Clear Duplicate': props<{ reportId: string }>(),
    'Duplicate As New': props<{
      reportId: string;
      authorId: string;
      newId: string;
    }>(),
    'Reset To Seed': emptyProps()
  }
});
