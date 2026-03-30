import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  DuplicateHint,
  ReportCardComponent
} from '../../components/report-card/report-card.component';
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

  submit(): void {
    this.formError.set(null);
    this.toast.set(null);
    const u = this.me();
    if (!u) return;
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
    const id = this.reports.addReport({
      title,
      body,
      category: this.draftCategory,
      locationLabel: loc,
      authorId: u.id
    });
    this.draftTitle = '';
    this.draftBody = '';
    this.draftLocation = '';
    this.toast.set('Report submitted. Taking you to the thread…');
    setTimeout(() => {
      void this.router.navigate(['/report', id]);
      this.toast.set(null);
    }, 400);
  }
}
