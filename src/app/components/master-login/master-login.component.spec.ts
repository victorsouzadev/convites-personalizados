import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MasterLoginComponent } from './master-login.component';
import { MasterAuthService } from '../../services/master-auth.service';

describe('MasterLoginComponent', () => {
    let fixture: ComponentFixture<MasterLoginComponent>;
    let component: MasterLoginComponent;
    let masterAuthSpy: jasmine.SpyObj<MasterAuthService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        masterAuthSpy = jasmine.createSpyObj('MasterAuthService', ['login']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [MasterLoginComponent],
            providers: [
                { provide: MasterAuthService, useValue: masterAuthSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MasterLoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('deve navegar para /master após login com senha correta', async () => {
        masterAuthSpy.login.and.returnValue(Promise.resolve(true));
        component.password = 'senha-correta';
        await component.submit();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/master']);
    });

    it('deve exibir mensagem de erro com senha incorreta', async () => {
        masterAuthSpy.login.and.returnValue(Promise.resolve(false));
        component.password = 'senha-errada';
        await component.submit();
        expect(component.error).toBeTruthy();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
});
