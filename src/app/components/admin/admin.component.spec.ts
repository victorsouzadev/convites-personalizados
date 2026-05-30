import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { AdminComponent } from './admin.component';
import { AuthService } from '../../services/auth.service';
import { MasterAuthService } from '../../services/master-auth.service';
import { GuestService } from '../../services/guest.service';
import { ConviteConfigService } from '../../services/convite-config.service';

describe('AdminComponent — isolamento por slug', () => {
    let authSpy: jasmine.SpyObj<AuthService>;
    let masterAuthSpy: jasmine.SpyObj<MasterAuthService>;

    beforeEach(async () => {
        authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticatedForSlug', 'logout']);
        masterAuthSpy = jasmine.createSpyObj('MasterAuthService', ['isAuthenticated']);
        masterAuthSpy.isAuthenticated.and.returnValue(false);

        const guestSpy = jasmine.createSpyObj('GuestService', ['list', 'subscribe']);
        guestSpy.list = jasmine.createSpy().and.returnValue(Promise.resolve([]));
        guestSpy.subscribe = jasmine.createSpy().and.returnValue(of([]));

        const configSpy = jasmine.createSpyObj('ConviteConfigService', ['load']);
        configSpy.load.and.returnValue(Promise.resolve(null));

        await TestBed.configureTestingModule({
            imports: [AdminComponent],
            providers: [
                { provide: AuthService, useValue: authSpy },
                { provide: MasterAuthService, useValue: masterAuthSpy },
                { provide: GuestService, useValue: guestSpy },
                { provide: ConviteConfigService, useValue: configSpy },
                { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
                {
                    provide: ActivatedRoute,
                    useValue: { paramMap: of(new Map([['slug', 'slug-a']])), snapshot: { paramMap: { get: () => 'slug-a' } } },
                },
            ],
        }).compileComponents();
    });

    it('deve verificar autenticação para o slug correto', async () => {
        authSpy.isAuthenticatedForSlug.and.returnValue(true);
        const fixture = TestBed.createComponent(AdminComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(authSpy.isAuthenticatedForSlug).toHaveBeenCalledWith('slug-a');
    });
});
