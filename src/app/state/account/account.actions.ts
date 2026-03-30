import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const AccountActions = createActionGroup({
  source: 'Account',
  events: {
    Hydrate: props<{ userId: string | null }>(),
    'Sign In': props<{ userId: string }>(),
    'Sign Out': emptyProps()
  }
});
