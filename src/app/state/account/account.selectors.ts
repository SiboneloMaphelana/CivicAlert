import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SEED_USERS } from '../../data/seed';
import type { User } from '../../core/models';
import type { AccountState } from './account.reducer';

export const selectAccountState = createFeatureSelector<AccountState>('account');

export const selectCurrentUserId = createSelector(
  selectAccountState,
  (s) => s.currentUserId
);

export const selectIsAuthenticated = createSelector(
  selectCurrentUserId,
  (id) => id != null
);

export const selectCurrentUser = createSelector(
  selectCurrentUserId,
  (id): User | null => (id != null ? SEED_USERS.find((u) => u.id === id) ?? null : null)
);

export const selectIsModerator = createSelector(
  selectCurrentUser,
  (u) => u?.role === 'moderator'
);
