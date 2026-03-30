import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  DuplicateHint,
  ReportCardComponent
} from '../../components/report-card/report-card.component';
import { AppNoticeService } from '../../core/app-notice.service';
import type { CivicReport, User } from '../../core/models';
import { REPORT_CATEGORIES } from '../../data/categories';
import { AccountFacade } from '../../state/account/account.facade';
import { ReportsFacade } from '../../state/reports/reports.facade';

type StatusFilter = 'active' | 'resolved' | 'all';
type SortMode = 'new' | 'support' | 'updated';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [RouterLink, FormsModule, ReportCardComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  readonly reports = inject(ReportsFacade);
  readonly account = inject(AccountFacade);
  readonly notices = inject(AppNoticeService);
  private readonly router = inject(Router);

  readonly me = toSignal(this.account.currentUser$, {
    initialValue: null as User | null
  });
  readonly isModerator = toSignal(this.account.isModerator$, {
    initialValue: false
  });
  readonly moderationQueue = toSignal(this.reports.moderationQueue$, {
    initialValue: [] as CivicReport[]
  });
  readonly publicReportRows = toSignal(this.reports.publicReports$, {
    initialValue: [] as CivicReport[]
  });
  readonly allItems = toSignal(this.reports.items$, {
    initialValue: [] as CivicReport[]
  });

  readonly categories = [...REPORT_CATEGORIES];
  readonly categoryFilters = ['All', ...REPORT_CATEGORIES] as const;

  readonly statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'active', label: 'Open & in progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'all', label: 'All' }
  ];

  readonly filterCat = signal<string>('All');
  readonly statusFilter = signal<StatusFilter>('active');
  readonly sortMode = signal<SortMode>('new');
  readonly search = signal('');

  readonly formError = signal<string | null>(null);
  readonly toast = signal<string | null>(null);

  draftTitle = '';
  draftBody = '';
  draftCategory = 'Streets';
  draftLocation = '';

  readonly filteredReports = computed(() => {
    const cat = this.filterCat();
    const q = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    const sort = this.sortMode();
    let rows = [...this.publicReportRows()];

    if (cat !== 'All') {
      rows = rows.filter((r) => r.category === cat);
    }

    if (status === 'active') {
      rows = rows.filter((r) =>
        ['open', 'triaged', 'in_progress'].includes(r.status)
      );
    } else if (status === 'resolved') {
      rows = rows.filter((r) => r.status === 'resolved');
    }

    if (q.length > 0) {
      rows = rows.filter((r) => {
        const blob = `${r.title} ${r.body} ${r.locationLabel}`.toLowerCase();
        return blob.includes(q);
      });
    }

    if (sort === 'new') {
      rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (sort === 'support') {
      rows.sort(
        (a, b) =>
          this.reports.supportsCount(b) - this.reports.supportsCount(a) ||
          b.createdAt.localeCompare(a.createdAt)
      );
    } else {
      rows.sort((a, b) => b.lastUpdatedAt.localeCompare(a.lastUpdatedAt));
    }

    return rows;
  });

  authorName(id: string): string {
    return this.account.getUserById(id)?.name ?? id;
  }

  duplicateHintsFor(id: string): DuplicateHint[] {
    return this.reports
      .potentialDuplicates(this.publicReportRows(), id, 0.42)
      .map((d) => {
        const rep = this.allItems().find((x) => x.id === d.id);
        const title = rep?.title ?? d.id;
        return {
          id: d.id,
          title: title.length > 56 ? `${title.slice(0, 56)}…` : title,
          score: d.score
        };
      });
  }

  async submit(): Promise<void> {
    this.formError.set(null);
    this.toast.set(null);
    const u = this.me();
    if (!u) {
      this.formError.set('Sign in before filing a report.');
      return;
    }
    const title = this.draftTitle.trim();
    const body = this.draftBody.trim();
    const loc = this.draftLocation.trim();
    if (title.length < 8) {
      this.formError.set('Please use at least 8 characters in the title.');
      return;
    }
    if (body.length < 24) {
      this.formError.set(
        'Add a bit more detail (at least 24 characters) so crews know what to check.'
      );
      return;
    }
    if (loc.length < 4) {
      this.formError.set('Please describe a specific location.');
      return;
    }
    const result = this.reports.addReport({
      title,
      body,
      category: this.draftCategory,
      locationLabel: loc,
      authorId: u.id
    });
    if (!result.ok || !result.data) {
      this.formError.set(
        result.ok ? 'The app could not create the report.' : result.message
      );
      return;
    }
    const reportId = result.data;
    this.draftTitle = '';
    this.draftBody = '';
    this.draftLocation = '';
    this.toast.set('Report submitted. Taking you to the thread...');
    try {
      const navigated = await this.router.navigate(['/report', reportId]);
      if (!navigated) {
        this.notices.error(
          'The report was saved, but the app could not open the new thread automatically.'
        );
      }
    } catch {
      this.notices.error(
        'The report was saved, but navigation to the new thread failed.'
      );
    } finally {
      setTimeout(() => this.toast.set(null), 400);
    }
  }
}
