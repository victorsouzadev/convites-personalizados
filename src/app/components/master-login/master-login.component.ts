import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MasterAuthService } from '../../services/master-auth.service';

@Component({
    selector: 'app-master-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
                <h1 class="text-2xl font-semibold text-gray-800 mb-6 text-center">Painel Master</h1>
                <form (ngSubmit)="submit()" class="space-y-4">
                    <div>
                        <label class="block text-sm text-gray-600 mb-1">Senha de acesso</label>
                        <input
                            type="password"
                            autocomplete="current-password"
                            [(ngModel)]="password"
                            name="password"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                            placeholder="Digite a senha"
                            required
                        />
                    </div>
                    @if (error) {
                        <p class="text-red-500 text-sm">{{ error }}</p>
                    }
                    <button
                        type="submit"
                        [disabled]="loading"
                        class="w-full bg-gray-800 text-white py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50"
                    >
                        {{ loading ? 'Verificando...' : 'Entrar' }}
                    </button>
                </form>
            </div>
        </div>
    `,
})
export class MasterLoginComponent {
    password = '';
    error = '';
    loading = false;

    constructor(
        private auth: MasterAuthService,
        private router: Router,
        private cdr: ChangeDetectorRef,
    ) {}

    async submit(): Promise<void> {
        if (!this.password.trim()) {
            this.error = 'Digite a senha.';
            this.cdr.markForCheck();
            return;
        }
        this.loading = true;
        this.error = '';
        this.cdr.markForCheck();

        const ok = await this.auth.login(this.password);
        if (ok) {
            this.router.navigate(['/master']);
        } else {
            this.loading = false;
            this.error = 'Senha incorreta.';
            this.cdr.markForCheck();
        }
    }
}
