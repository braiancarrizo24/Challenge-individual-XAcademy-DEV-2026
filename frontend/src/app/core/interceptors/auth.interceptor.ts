
import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

import { Auth } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(Auth);
  const token = authService.getToken();

  const isBackendRequest = request.url.startsWith(
    'http://localhost:3000/'
  );

  if (token && isBackendRequest) {
    const authenticatedRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return next(authenticatedRequest);
  }

  return next(request);
};
