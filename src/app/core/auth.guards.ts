import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import type { AppState } from '../state/app.reducer';
import { safeInternalAppPath } from './auth-url';
import {
  selectIsAuthenticated,
  selectIsModerator
} from '../state/account/account.selectors';

/** Allow route only when signed out; otherwise send to `returnUrl` or Account. */
export const guestOnlyGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const store = inject(Store<AppState>);
  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map((authed) => {
      if (!authed) return true;
      const next = safeInternalAppPath(route.queryParamMap.get('returnUrl'));
      return router.parseUrl(next);
    })
  );
};

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const store = inject(Store<AppState>);
  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map((ok) =>
      ok
        ? true
        : router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url }
          })
    )
  );
};

export const moderatorGuard: CanActivateFn = () => {
  const router = inject(Router);
  const store = inject(Store<AppState>);
  return store.select(selectIsModerator).pipe(
    take(1),
    map((mod) =>
      mod ? true : router.createUrlTree(['/'], { queryParams: { denied: '1' } })
    )
  );
};
