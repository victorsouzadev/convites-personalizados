import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MasterAuthService } from '../services/master-auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const auth = inject(AuthService);
    const masterAuth = inject(MasterAuthService);
    const router = inject(Router);
    const slug = route.paramMap.get('slug') ?? '';
    if (masterAuth.isAuthenticated()) return true;
    if (auth.isAuthenticatedForSlug(slug)) return true;
    return router.createUrlTree([`/${slug}/login`]);
};
