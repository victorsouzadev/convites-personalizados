import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const STORAGE_KEY = 'convite_admin_auth';
const SLUG_KEY = 'convite_admin_slug';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private authed = new BehaviorSubject<boolean>(
        typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true'
    );
    readonly isAuthenticated$ = this.authed.asObservable();

    login(password: string, expected: string, slug: string): boolean {
        if (password.trim() === expected.trim()) {
            this.authed.next(true);
            localStorage.setItem(STORAGE_KEY, 'true');
            localStorage.setItem(SLUG_KEY, slug);
            return true;
        }
        return false;
    }

    logout(): void {
        this.authed.next(false);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SLUG_KEY);
    }

    isAuthenticated(): boolean {
        return this.authed.value;
    }

    isAuthenticatedForSlug(slug: string): boolean {
        if (!this.authed.value) return false;
        const storedSlug = typeof localStorage !== 'undefined' ? localStorage.getItem(SLUG_KEY) : null;
        return storedSlug === slug;
    }
}
