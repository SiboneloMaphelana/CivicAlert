import { ActionReducerMap } from '@ngrx/store';
import { accountReducer, type AccountState } from './account/account.reducer';
import { reportsReducer, type ReportsState } from './reports/reports.reducer';

export interface AppState {
  reports: ReportsState;
  account: AccountState;
}

export const reducers: ActionReducerMap<AppState> = {
  reports: reportsReducer,
  account: accountReducer
};
