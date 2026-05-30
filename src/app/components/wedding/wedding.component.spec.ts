import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { WeddingComponent } from './wedding.component';
import { ConviteConfigService, ConviteConfig } from '../../services/convite-config.service';
import { GuestService } from '../../services/guest.service';
import { EventTypeService } from '../../services/event-type.service';
import { EVENT_TYPE_CONFIGS } from '../../models/event-type.model';

const makeConfig = (tipo: ConviteConfig['tipo']): ConviteConfig => ({
    slug: 'test',
    tipo,
    noivo: 'João',
    noiva: 'Maria',
    data_casamento: '2026-08-15T19:00:00',
    local_nome: 'Salão',
    local_endereco: 'Rua A',
    local_map_embed_url: '',
    local_map_link: '',
    whatsapp_noivo: '11999999999',
    whatsapp_noiva: '11999999998',
    pix_codigo: 'pix123',
    spotify_track_id: '',
    instagram: '',
    admin_senha: 'senha',
    cor_primaria: '#4a6e3a',
    cor_acento: '#a08040',
    tema: 'green',
    foto_capa: 'capa.jpg',
    foto_envelope: 'capa.jpg',
    foto_share: 'share.jpg',
});

describe('WeddingComponent — seções por tipo', () => {
    let fixture: ComponentFixture<WeddingComponent>;
    let configSpy: jasmine.SpyObj<ConviteConfigService>;

    async function setup(tipo: ConviteConfig['tipo']) {
        configSpy = jasmine.createSpyObj('ConviteConfigService', ['load']);
        configSpy.load.and.returnValue(Promise.resolve(makeConfig(tipo)));

        const guestSpy = jasmine.createSpyObj('GuestService', ['trackOpen', 'getBySlugAndId']);
        guestSpy.trackOpen = jasmine.createSpy().and.returnValue(Promise.resolve());
        guestSpy.getBySlugAndId = jasmine.createSpy().and.returnValue(Promise.resolve(null));

        await TestBed.configureTestingModule({
            imports: [WeddingComponent],
            providers: [
                { provide: ConviteConfigService, useValue: configSpy },
                { provide: GuestService, useValue: guestSpy },
                { provide: EventTypeService, useValue: { getConfig: (t: string) => EVENT_TYPE_CONFIGS[t as keyof typeof EVENT_TYPE_CONFIGS] } },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'test' }, queryParamMap: { get: () => null } }, queryParams: of({}) } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WeddingComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    it('aniversario deve ocultar seção de traje', async () => {
        await setup('aniversario');
        const el: HTMLElement = fixture.nativeElement;
        expect(el.querySelector('[data-section="traje"]')).toBeNull();
    });

    it('aniversario deve ocultar seção de PIX', async () => {
        await setup('aniversario');
        const el: HTMLElement = fixture.nativeElement;
        expect(el.querySelector('[data-section="pix"]')).toBeNull();
    });

    it('casamento deve exibir seção de traje', async () => {
        await setup('casamento');
        const el: HTMLElement = fixture.nativeElement;
        expect(el.querySelector('[data-section="traje"]')).not.toBeNull();
    });

    it('tipo ausente deve usar fallback casamento (sem erro)', async () => {
        await setup('casamento');
        expect(fixture.componentInstance.eventTypeCfg).toBeTruthy();
    });
});
