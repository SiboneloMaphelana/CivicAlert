import { inject, provideAppInitializer } from '@angular/core';
import { Store } from '@ngrx/store';
import { dispatchAppNotice } from '../core/app-notice.service';
import { SEED_USERS } from '../data/seed';
import type { AppState } from './app.reducer';
import { AccountActions } from './account/account.actions';
import { ReportsActions } from './reports/reports.actions';
import {
  parseReportsJson,
  REPORTS_STORAGE_V1,
  REPORTS_STORAGE_V2,
  seedReportsSnapshot,
  sortReports
} from './reports/reports.helpers';

const STORAGE_USER = 'civic-alert-current-user-id';

function isBrowser(): boolean {
  return typeof localStorage !== 'undefined';
}

export function provideStoreHydration() {
  return provideAppInitializer(() => {
    const store = inject(Store<AppState>);

    if (!isBrowser()) {
      // Server-side rendering cannot read browser storage, so fall back to seed data.
      store.dispatch(ReportsActions.hydrate({ items: seedReportsSnapshot() }));
      store.dispatch(AccountActions.hydrate({ userId: null }));
      return;
    }

    let raw: string | null = null;
    let hadV1 = false;
    try {
      // Prefer the current storage key, but fall back to the previous version for upgrades.
      raw = localStorage.getItem(REPORTS_STORAGE_V2);
      hadV1 = !raw && !!localStorage.getItem(REPORTS_STORAGE_V1);
      if (!raw) {
        raw = localStorage.getItem(REPORTS_STORAGE_V1);
      }
    } catch {
      dispatchAppNotice({
        tone: 'error',
        message:
          'Saved browser data could not be loaded. The app started with the bundled demo dataset instead.'
      });
    }

    let items = raw
      ? parseReportsJson(raw).filter((r) => r.id.length > 0)
      : [];
    // If saved data exists but parses to nothing, treat it as corrupted and recover gracefully.
    if (raw && raw.trim().length > 0 && items.length === 0) {
      dispatchAppNotice({
        tone: 'warning',
        message:
          'Saved report data was corrupted or unreadable, so the app restored the default demo data.'
      });
    }
    if (items.length === 0) {
      items = seedReportsSnapshot();
    } else {
      items = sortReports(items);
    }

    store.dispatch(ReportsActions.hydrate({ items }));

    if (hadV1) {
      try {
        localStorage.removeItem(REPORTS_STORAGE_V1);
      } catch {
        dispatchAppNotice({
          tone: 'warning',
          message:
            'Older saved report data could not be cleaned up automatically.'
        });
      }
    }

    let uidRaw: string | null = null;
    try {
      uidRaw = localStorage.getItem(STORAGE_USER);
    } catch {
      dispatchAppNotice({
        tone: 'warning',
        message:
          'Your saved sign-in session could not be restored in this browser.'
      });
    }
    if (uidRaw && SEED_USERS.some((u) => u.id === uidRaw)) {
      store.dispatch(AccountActions.hydrate({ userId: uidRaw }));
    } else {
      // Clear unknown user ids so the demo never restores an invalid session.
      store.dispatch(AccountActions.hydrate({ userId: null }));
      try {
        localStorage.removeItem(STORAGE_USER);
      } catch {
        dispatchAppNotice({
          tone: 'warning',
          message:
            'An invalid saved sign-in session could not be removed automatically.'
        });
      }
    }
  });
}
