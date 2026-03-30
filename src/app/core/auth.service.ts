import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { findDemoCredential } from '../data/demo-credentials';
import { verifyPbkdf2Sha256 } from '../lib/password-verify';
import type { AppState } from '../state/app.reducer';
import { AccountActions } from '../state/account/account.actions';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly store = inject(Store<AppState>);

  /**
   * Verifies email/password against demo credential store and establishes session (NgRx + localStorage).
   */
  async login(
    email: string,
    password: string
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const normalized = email.trim().toLowerCase();
    const row = findDemoCredential(normalized);
    if (!row) {
      return { ok: false, error: 'Invalid email or password.' };
    }

    const valid = await verifyPbkdf2Sha256(password, row.saltB64, row.hashB64);
    if (!valid) {
      return { ok: false, error: 'Invalid email or password.' };
    }

    this.store.dispatch(AccountActions.signIn({ userId: row.userId }));
    return { ok: true };
  }
}
