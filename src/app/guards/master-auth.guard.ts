import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MasterAuthService } from '../services/master-auth.service';

export const masterAuthGuard: CanActivateFn = () => {
    const auth = inject(MasterAuthService);
    const router = inject(Router);
    if (auth.isAuthenticated()) return true;
    return router.createUrlTree(['/master/login']);
};
