import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

// Usage in routes: { path: 'admin/users', canActivate: [roleGuard], data: { roles: ['admin'] }, ... }
export const roleGuard: CanActivateFn = (route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (!session.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  const roles = (route.data['roles'] ?? []) as string[];
  if (roles.includes(session.role() as string)) return true;
  return router.createUrlTree(['/']);
};
