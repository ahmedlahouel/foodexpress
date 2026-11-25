import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '../services/api-url';
import { SessionService } from '../services/session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const token = localStorage.getItem('token');

  // The token is only sent to our own API
  const authReq =
    token && req.url.startsWith(API_URL)
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Expired token, or account deactivated while logged in -> log out.
      // /auth/ routes are excluded: a wrong password is also a 401 and must stay on the login page.
      const isAuthRoute = req.url.includes('/auth/');
      const deactivated = err.status === 403 && err.error?.message === 'Compte désactivé';
      if (!isAuthRoute && (err.status === 401 || deactivated)) {
        session.logout();
      }
      return throwError(() => err);
    }),
  );
};
