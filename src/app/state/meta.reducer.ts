import { ActionReducer, MetaReducer } from '@ngrx/store';
import { dispatchAppNotice } from '../core/app-notice.service';
import type { AppState } from './app.reducer';
import { REPORTS_STORAGE_V2 } from './reports/reports.helpers';

const STORAGE_USER = 'civic-alert-current-user-id';

function isBrowser(): boolean {
  return typeof localStorage !== 'undefined';
}

export function persistAppMetaReducer(
  reducer: ActionReducer<AppState>
): ActionReducer<AppState> {
  return (state, action) => {
    const next = reducer(state, action);
    if (!isBrowser() || !next) {
      return next;
    }
    try {
      localStorage.setItem(
        REPORTS_STORAGE_V2,
        JSON.stringify(next.reports.items)
      );
      const uid = next.account.currentUserId;
      if (uid != null) {
        localStorage.setItem(STORAGE_USER, uid);
      } else {
        localStorage.removeItem(STORAGE_USER);
      }
    } catch {
      dispatchAppNotice({
        tone: 'error',
        message:
          'Changes could not be saved in this browser. Your latest update may be lost after refresh.'
      });
    }
    return next;
  };
}

export const metaReducers: MetaReducer<AppState>[] = [persistAppMetaReducer];
