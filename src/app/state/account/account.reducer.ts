import { createReducer, on } from '@ngrx/store';
import { AccountActions } from './account.actions';

export interface AccountState {
  currentUserId: string | null;
}

export const initialAccountState: AccountState = {
  currentUserId: null
};

export const accountReducer = createReducer(
  initialAccountState,
  on(
    AccountActions.hydrate,
    (_state, { userId }): AccountState => ({ currentUserId: userId })
  ),
  on(
    AccountActions.signIn,
    (_state, { userId }): AccountState => ({ currentUserId: userId })
  ),
  on(AccountActions.signOut, (): AccountState => ({ currentUserId: null }))
);
