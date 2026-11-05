import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
} from '@angular/router';

import { catchError, map, of } from 'rxjs';

import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const authService = inject(Auth);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  return authService.getProfile().pipe(
    map(() => true),
    catchError(() => {
      authService.logout();

      return of(router.createUrlTree(['/login']));
    })
  );
};