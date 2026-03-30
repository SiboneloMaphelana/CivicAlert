import { Injectable, signal } from '@angular/core';

export type AppNoticeTone = 'success' | 'error' | 'warning' | 'info';

export interface AppNotice {
  tone: AppNoticeTone;
  message: string;
}

const NOTICE_EVENT = 'civic-alert:notice';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function dispatchAppNotice(notice: AppNotice): void {
  if (!isBrowser()) return;
  // This lets non-component code (like store startup/persistence) trigger UI messages.
  window.dispatchEvent(
    new CustomEvent<AppNotice>(NOTICE_EVENT, { detail: notice })
  );
}

@Injectable({ providedIn: 'root' })
export class AppNoticeService {
  readonly current = signal<AppNotice | null>(null);

  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (!isBrowser()) return;
    // Listen once at the app level so any part of the codebase can publish notices.
    window.addEventListener(NOTICE_EVENT, this.onNotice as EventListener);
  }

  show(
    tone: AppNoticeTone,
    message: string,
    durationMs = tone === 'error' ? 7000 : 4000
  ): void {
    // Errors stay on screen a little longer to give users time to read them.
    this.current.set({ tone, message });
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (durationMs > 0) {
      this.timeoutId = setTimeout(() => {
        this.current.set(null);
        this.timeoutId = null;
      }, durationMs);
    }
  }

  success(message: string, durationMs?: number): void {
    this.show('success', message, durationMs);
  }

  error(message: string, durationMs?: number): void {
    this.show('error', message, durationMs);
  }

  warning(message: string, durationMs?: number): void {
    this.show('warning', message, durationMs);
  }

  info(message: string, durationMs?: number): void {
    this.show('info', message, durationMs);
  }

  dismiss(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.current.set(null);
  }

  private readonly onNotice = (event: CustomEvent<AppNotice>): void => {
    this.show(event.detail.tone, event.detail.message);
  };
}
