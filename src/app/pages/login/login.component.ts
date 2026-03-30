import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { AppNoticeService } from '../../core/app-notice.service';
import { safeInternalAppPath } from '../../core/auth-url';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notices = inject(AppNoticeService);

  readonly returnUrl = toSignal(
    this.route.queryParamMap.pipe(
      map((m) => safeInternalAppPath(m.get('returnUrl')))
    ),
    { initialValue: '/account' }
  );

  email = '';
  password = '';
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);

  async submit(): Promise<void> {
    this.error.set(null);
    if (!this.email.trim()) {
      this.error.set('Enter your email address.');
      return;
    }
    if (!this.password) {
      this.error.set('Enter your password.');
      return;
    }
    this.busy.set(true);
    try {
      const result = await this.auth.login(this.email, this.password);
      if (!result.ok) {
        this.error.set(result.error);
        return;
      }
      const navigated = await this.router.navigateByUrl(this.returnUrl());
      if (!navigated) {
        this.notices.warning(
          'You are signed in, but the app could not open the next page automatically.'
        );
      }
    } catch {
      this.error.set(
        'Something went wrong while signing you in. Please try again.'
      );
    } finally {
      this.busy.set(false);
    }
  }
}
