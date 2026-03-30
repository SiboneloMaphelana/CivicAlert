import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Observable } from 'rxjs';
import type { ActionResult } from '../../core/action-result';
import { SEED_USERS } from '../../data/seed';
import type { User } from '../../core/models';
import type { AppState } from '../app.reducer';
import { AccountActions } from './account.actions';
import {
  selectCurrentUser,
  selectCurrentUserId,
  selectIsModerator
} from './account.selectors';

@Injectable({ providedIn: 'root' })
export class AccountFacade {
  private readonly store = inject(Store<AppState>);
  // `selectSignal` gives us the current user id synchronously for simple guards.
  private readonly currentUserId = this.store.selectSignal(selectCurrentUserId);

  readonly currentUser$: Observable<User | null> =
    this.store.select(selectCurrentUser);
  readonly currentUserId$: Observable<string | null> =
    this.store.select(selectCurrentUserId);
  readonly isModerator$: Observable<boolean> =
    this.store.select(selectIsModerator);

  signOut(): ActionResult {
    // Return a user-facing result so screens can show clear feedback.
    if (!this.currentUserId()) {
      return {
        ok: false,
        message: 'You are already signed out.'
      };
    }
    this.store.dispatch(AccountActions.signOut());
    return {
      ok: true,
      message: 'You signed out successfully.'
    };
  }

  getUserById(id: string): User | undefined {
    // User profiles are seeded locally in this demo, so a simple lookup is enough.
    return SEED_USERS.find((u) => u.id === id);
  }
}
