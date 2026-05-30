import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({});
        service = TestBed.inject(AuthService);
    });

    it('deve autenticar e armazenar o slug correto', () => {
        const ok = service.login('senha123', 'senha123', 'slug-a');
        expect(ok).toBeTrue();
        expect(service.isAuthenticatedForSlug('slug-a')).toBeTrue();
    });

    it('não deve autenticar com senha errada', () => {
        const ok = service.login('errada', 'certa', 'slug-a');
        expect(ok).toBeFalse();
        expect(service.isAuthenticatedForSlug('slug-a')).toBeFalse();
    });

    it('senha do slug-a não deve autenticar slug-b (FR-007)', () => {
        service.login('senha', 'senha', 'slug-a');
        expect(service.isAuthenticatedForSlug('slug-b')).toBeFalse();
    });

    it('logout deve limpar a autenticação', () => {
        service.login('senha', 'senha', 'slug-a');
        service.logout();
        expect(service.isAuthenticatedForSlug('slug-a')).toBeFalse();
    });
});
