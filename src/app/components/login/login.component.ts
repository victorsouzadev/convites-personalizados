import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ConviteConfigService } from '../../services/convite-config.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="min-h-screen flex items-center justify-center px-6" style="background: linear-gradient(160deg, #f5f2ea 0%, #e8e2d0 100%);">
        <div class="w-full max-w-xs">
            <h1 class="font-script text-center text-[#2d4a2a] mb-2" style="font-size:3rem; font-family: 'Great Vibes', cursive;">Admin</h1>
            <p class="text-[9px] tracking-[0.4em] uppercase text-center text-[#5a7848] mb-8">{{ slug }}</p>
            <div class="flex flex-col gap-3">
                <input
                    [(ngModel)]="password"
                    type="password"
                    autocomplete="current-password"
                    placeholder="Senha"
                    (keyup.enter)="login()"
                    class="border border-[#7a9a6a]/40 rounded-xl px-4 py-3 text-sm text-[#2d4a2a] outline-none focus:border-[#4a6e3a] bg-white text-center tracking-widest"
                />
                @if (error) {
                    <p class="text-center text-[9px] text-red-400 tracking-wider">Senha incorreta</p>
                }
                <button (click)="login()"
                    class="py-3 rounded-xl text-[10px] tracking-[0.3em] uppercase text-white transition-all"
                    style="background-color: #4a6e3a;">
                    Entrar
                </button>
            </div>
        </div>
    </div>
    `,
    styles: [],
})
export class LoginComponent implements OnInit {
    slug = '';
    password = '';
    error = false;
    private adminSenha = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private configService: ConviteConfigService,
    ) {}

    async ngOnInit() {
        this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
        const cfg = await this.configService.load(this.slug);
        if (cfg) this.adminSenha = cfg.admin_senha;
        if (this.authService.isAuthenticatedForSlug(this.slug)) {
            this.router.navigate([`/${this.slug}/admin`]);
        }
    }

    login() {
        if (this.authService.login(this.password, this.adminSenha, this.slug)) {
            this.router.navigate([`/${this.slug}/admin`]);
        } else {
            this.error = true;
        }
    }
}
