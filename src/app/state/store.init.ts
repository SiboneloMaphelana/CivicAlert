import { inject, provideAppInitializer } from '@angular/core';
import { Store } from '@ngrx/store';
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
      store.dispatch(ReportsActions.hydrate({ items: seedReportsSnapshot() }));
      store.dispatch(AccountActions.hydrate({ userId: 'u-alex' }));
      return;
    }

    let raw = localStorage.getItem(REPORTS_STORAGE_V2);
    const hadV1 = !raw && !!localStorage.getItem(REPORTS_STORAGE_V1);
    if (!raw) {
      raw = localStorage.getItem(REPORTS_STORAGE_V1);
    }

    let items = raw
      ? parseReportsJson(raw).filter((r) => r.id.length > 0)
      : [];
    if (items.length === 0) {
      items = seedReportsSnapshot();
    } else {
      items = sortReports(items);
    }

    store.dispatch(ReportsActions.hydrate({ items }));

    if (hadV1) {
      localStorage.removeItem(REPORTS_STORAGE_V1);
    }

    const uidRaw = localStorage.getItem(STORAGE_USER);
    if (uidRaw && SEED_USERS.some((u) => u.id === uidRaw)) {
      store.dispatch(AccountActions.hydrate({ userId: uidRaw }));
    } else {
      store.dispatch(AccountActions.hydrate({ userId: 'u-alex' }));
      localStorage.setItem(STORAGE_USER, 'u-alex');
    }
  });
}
