import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
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
    this.busy.set(true);
    try {
      const result = await this.auth.login(this.email, this.password);
      if (!result.ok) {
        this.error.set(result.error);
        return;
      }
      await this.router.navigateByUrl(this.returnUrl());
    } finally {
      this.busy.set(false);
    }
  }
}
