import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Observable } from 'rxjs';
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

  readonly currentUser$: Observable<User | null> =
    this.store.select(selectCurrentUser);
  readonly currentUserId$: Observable<string | null> =
    this.store.select(selectCurrentUserId);
  readonly isModerator$: Observable<boolean> =
    this.store.select(selectIsModerator);

  readonly demoUsers: readonly User[] = SEED_USERS;

  signInAs(userId: string): void {
    if (!SEED_USERS.some((u) => u.id === userId)) return;
    this.store.dispatch(AccountActions.signIn({ userId }));
  }

  signOut(): void {
    this.store.dispatch(AccountActions.signOut());
  }

  getUserById(id: string): User | undefined {
    return SEED_USERS.find((u) => u.id === id);
  }
}
