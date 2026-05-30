import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { masterAuthGuard } from './guards/master-auth.guard';

export const routes: Routes = [
    {
        path: 'master/login',
        loadComponent: () => import('./components/master-login/master-login.component').then(m => m.MasterLoginComponent),
    },
    {
        path: 'master',
        canActivate: [masterAuthGuard],
        loadComponent: () => import('./components/master-admin/master-admin.component').then(m => m.MasterAdminComponent),
    },
    {
        path: ':slug/entrada',
        loadComponent: () => import('./components/envelope/envelope.component').then(m => m.EnvelopeComponent),
    },
    {
        path: ':slug/convite',
        loadComponent: () => import('./components/wedding/wedding.component').then(m => m.WeddingComponent),
    },
    {
        path: ':slug/login',
        loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
    },
    {
        path: ':slug/admin',
        canActivate: [authGuard],
        loadComponent: () => import('./components/admin/admin.component').then(m => m.AdminComponent),
    },
    {
        path: ':slug/admin/editar',
        canActivate: [authGuard],
        loadComponent: () => import('./components/edit-convite/edit-convite.component').then(m => m.EditConviteComponent),
    },
    { path: '**', redirectTo: '' },
];
