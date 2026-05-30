import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MasterAdminComponent } from './master-admin.component';
import { MasterAdminService } from '../../services/master-admin.service';
import { EventTypeService } from '../../services/event-type.service';
import { Router } from '@angular/router';

describe('MasterAdminComponent', () => {
    let fixture: ComponentFixture<MasterAdminComponent>;
    let component: MasterAdminComponent;
    let masterAdminSpy: jasmine.SpyObj<MasterAdminService>;

    const fakeEvents = [
        { slug: 'joao-maria', tipo: 'casamento' as const, data_casamento: '2026-08-15T19:00:00', guest_count: 50 },
        { slug: 'ana-40anos', tipo: 'aniversario' as const, data_casamento: '2026-07-10T20:00:00', guest_count: 30 },
    ];

    beforeEach(async () => {
        masterAdminSpy = jasmine.createSpyObj('MasterAdminService', ['listEvents', 'createEvent', 'deleteEvent']);
        masterAdminSpy.listEvents.and.returnValue(Promise.resolve(fakeEvents));
        masterAdminSpy.createEvent.and.returnValue(Promise.resolve());
        masterAdminSpy.deleteEvent.and.returnValue(Promise.resolve());

        await TestBed.configureTestingModule({
            imports: [MasterAdminComponent],
            providers: [
                { provide: MasterAdminService, useValue: masterAdminSpy },
                { provide: EventTypeService, useValue: { getConfig: (t: string) => ({ label: t, roleName: 'R', showTraje: false, showPix: false, showWhatsAppConfirm: false }) } },
                { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MasterAdminComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    it('deve listar eventos ao inicializar', () => {
        expect(component.events.length).toBe(2);
    });

    it('deve rejeitar criação com slug vazio', async () => {
        component.newEvent.slug = '';
        await component.createEvent();
        expect(component.createError).toBeTruthy();
        expect(masterAdminSpy.createEvent).not.toHaveBeenCalled();
    });

    it('deve exibir erro quando createEvent lança exceção de slug duplicado', async () => {
        masterAdminSpy.createEvent.and.returnValue(Promise.reject(new Error('duplicate')));
        component.newEvent = { slug: 'joao-maria', tipo: 'casamento', admin_senha: '123', data_casamento: '', local_nome: '', rotulo_personalizado: '' };
        await component.createEvent();
        expect(component.createError).toBeTruthy();
    });
});
