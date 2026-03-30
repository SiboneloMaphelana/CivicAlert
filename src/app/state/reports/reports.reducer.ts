import { createReducer, on } from '@ngrx/store';
import type { CivicReport } from '../../core/models';
import { ReportsActions } from './reports.actions';
import { seedReportsSnapshot, sortReports } from './reports.helpers';

export interface ReportsState {
  items: CivicReport[];
}

const initialItems = seedReportsSnapshot();

export const initialReportsState: ReportsState = {
  items: initialItems
};

export const reportsReducer = createReducer(
  initialReportsState,
  on(ReportsActions.hydrate, (_state, { items }): ReportsState => ({
    items: sortReports(items)
  })),
  on(ReportsActions.addReport, (state, { id, draft }): ReportsState => {
    const now = new Date().toISOString();
    const row: CivicReport = {
      id,
      title: draft.title,
      body: draft.body,
      category: draft.category,
      locationLabel: draft.locationLabel,
      authorId: draft.authorId,
      createdAt: now,
      lastUpdatedAt: now,
      status: 'open',
      supportUserIds: [],
      inappropriateFlagUserIds: [],
      duplicateOfId: null,
      moderatorNote: null
    };
    return { items: sortReports([row, ...state.items]) };
  }),
  on(
    ReportsActions.toggleSupport,
    (state, { reportId, userId }): ReportsState => {
      const r = state.items.find((x) => x.id === reportId);
      if (!r || !['open', 'triaged', 'in_progress'].includes(r.status)) {
        return state;
      }
      const set = new Set(r.supportUserIds);
      if (set.has(userId)) set.delete(userId);
      else set.add(userId);
      const patch = { supportUserIds: [...set] };
      return {
        items: sortReports(
          state.items.map((x) =>
            x.id === reportId
              ? {
                  ...x,
                  ...patch,
                  lastUpdatedAt: new Date().toISOString()
                }
              : x
          )
        )
      };
    }
  ),
  on(
    ReportsActions.flagInappropriate,
    (state, { reportId, userId }): ReportsState => {
      const r = state.items.find((x) => x.id === reportId);
      if (
        !r ||
        r.status === 'hidden' ||
        r.status === 'duplicate' ||
        r.authorId === userId
      ) {
        return state;
      }
      const set = new Set(r.inappropriateFlagUserIds);
      if (set.has(userId)) return state;
      set.add(userId);
      return {
        items: sortReports(
          state.items.map((x) =>
            x.id === reportId
              ? {
                  ...x,
                  inappropriateFlagUserIds: [...set],
                  lastUpdatedAt: new Date().toISOString()
                }
              : x
          )
        )
      };
    }
  ),
  on(
    ReportsActions.setStatus,
    (state, { reportId, status, note }): ReportsState => ({
      items: sortReports(
        state.items.map((x) =>
          x.id === reportId
            ? {
                ...x,
                status,
                ...(note !== undefined ? { moderatorNote: note } : {}),
                lastUpdatedAt: new Date().toISOString()
              }
            : x
        )
      )
    })
  ),
  on(ReportsActions.hideReport, (state, { reportId, note }): ReportsState => ({
    items: sortReports(
      state.items.map((x) =>
        x.id === reportId
          ? {
              ...x,
              status: 'hidden',
              moderatorNote:
                note ?? 'Removed from public view by a moderator.',
              lastUpdatedAt: new Date().toISOString()
            }
          : x
      )
    )
  })),
  on(ReportsActions.restoreReport, (state, { reportId }): ReportsState => ({
    items: sortReports(
      state.items.map((x) =>
        x.id === reportId
          ? {
              ...x,
              status: 'open',
              moderatorNote: null,
              lastUpdatedAt: new Date().toISOString()
            }
          : x
      )
    )
  })),
  on(
    ReportsActions.markDuplicate,
    (state, { reportId, primaryId, note }): ReportsState => {
      if (reportId === primaryId) return state;
      const primary = state.items.find((x) => x.id === primaryId);
      if (!primary || primary.status === 'hidden') return state;
      return {
        items: sortReports(
          state.items.map((x) =>
            x.id === reportId
              ? {
                  ...x,
                  status: 'duplicate',
                  duplicateOfId: primaryId,
                  moderatorNote:
                    note ??
                    `Merged into the primary report ${primaryId} so neighbors see one thread.`,
                  lastUpdatedAt: new Date().toISOString()
                }
              : x
          )
        )
      };
    }
  ),
  on(ReportsActions.clearDuplicate, (state, { reportId }): ReportsState => ({
    items: sortReports(
      state.items.map((x) =>
        x.id === reportId
          ? {
              ...x,
              status: 'open',
              duplicateOfId: null,
              moderatorNote: null,
              lastUpdatedAt: new Date().toISOString()
            }
          : x
      )
    )
  })),
  on(
    ReportsActions.duplicateAsNew,
    (state, { reportId, authorId, newId }): ReportsState => {
      const src = state.items.find((x) => x.id === reportId);
      if (!src) return state;
      const now = new Date().toISOString();
      const copy: CivicReport = {
        ...src,
        id: newId,
        title: `${src.title} (follow-up)`,
        authorId,
        createdAt: now,
        lastUpdatedAt: now,
        status: 'open',
        supportUserIds: [],
        inappropriateFlagUserIds: [],
        duplicateOfId: null,
        moderatorNote: null,
        body: `${src.body}\n\n— Follow-up split from ${reportId} by a moderator.`
      };
      return { items: sortReports([copy, ...state.items]) };
    }
  ),
  on(
    ReportsActions.resetToSeed,
    (): ReportsState => ({ items: seedReportsSnapshot() })
  )
);
