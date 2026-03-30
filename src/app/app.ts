import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';
import { Store } from '@ngrx/store';
import { AppNoticeService } from './core/app-notice.service';
import type { AppState } from './state/app.reducer';
import { selectIsAuthenticated } from './state/account/account.selectors';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly store = inject(Store<AppState>);
  readonly notices = inject(AppNoticeService);
  readonly isAuthenticated = toSignal(
    this.store.select(selectIsAuthenticated),
    { initialValue: false }
  );
}
