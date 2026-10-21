import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isApi = req.url.startsWith('/api/');
  const isLogin = req.url.startsWith('/api/auth/login');
  const token = auth.token;

  // Lampirkan token pada panggilan API sahaja (bukan login)
  const outgoing =
    isApi && !isLogin && token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(outgoing).pipe(
    catchError((err: unknown) => {
      // Token tamat tempoh atau tidak sah pada panggilan dilindungi: kembali ke login
      if (err instanceof HttpErrorResponse && err.status === 401 && isApi && !isLogin) {
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};
