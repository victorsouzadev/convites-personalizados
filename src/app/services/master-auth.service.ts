import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';

const STORAGE_KEY = 'convite_master_auth';

@Injectable({ providedIn: 'root' })
export class MasterAuthService {
    private authed = new BehaviorSubject<boolean>(
        typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true'
    );
    readonly isAuthenticated$ = this.authed.asObservable();

    constructor(private sb: SupabaseService) {}

    async login(password: string): Promise<boolean> {
        try {
            const { data, error } = await this.sb.client.functions.invoke<{ valid: boolean }>(
                'verify-master-password',
                { body: { password } }
            );

            if (error || !data?.valid) return false;

            this.authed.next(true);
            localStorage.setItem(STORAGE_KEY, 'true');
            return true;
        } catch {
            return false;
        }
    }

    logout(): void {
        this.authed.next(false);
        localStorage.removeItem(STORAGE_KEY);
    }

    isAuthenticated(): boolean {
        return this.authed.value;
    }
}
