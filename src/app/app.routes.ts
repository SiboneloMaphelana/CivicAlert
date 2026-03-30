import { Routes } from '@angular/router';
import { authGuard, guestOnlyGuard, moderatorGuard } from './core/auth.guards';
import { AccountComponent } from './pages/account/account.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { ModerationComponent } from './pages/moderation/moderation.component';
import { ReportDetailComponent } from './pages/report-detail/report-detail.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestOnlyGuard]
  },
  { path: 'report/:id', component: ReportDetailComponent },
  {
    path: 'moderation',
    component: ModerationComponent,
    canActivate: [moderatorGuard]
  },
  { path: 'account', component: AccountComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
