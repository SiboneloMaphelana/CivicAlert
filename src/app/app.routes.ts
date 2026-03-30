import { Routes } from '@angular/router';
import { AccountComponent } from './pages/account/account.component';
import { HomeComponent } from './pages/home/home.component';
import { ModerationComponent } from './pages/moderation/moderation.component';
import { ReportDetailComponent } from './pages/report-detail/report-detail.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'report/:id', component: ReportDetailComponent },
  { path: 'moderation', component: ModerationComponent },
  { path: 'account', component: AccountComponent },
  { path: '**', redirectTo: '' }
];
