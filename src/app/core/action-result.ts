export type ActionResult<T = void> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; message: string };
