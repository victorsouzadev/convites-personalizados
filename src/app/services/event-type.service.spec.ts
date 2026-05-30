import { TestBed } from '@angular/core/testing';
import { EventTypeService } from './event-type.service';
import { EVENT_TYPES } from '../models/event-type.model';

describe('EventTypeService', () => {
    let service: EventTypeService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(EventTypeService);
    });

    it('casamento deve exibir traje e PIX e confirmação WhatsApp', () => {
        const cfg = service.getConfig('casamento');
        expect(cfg.showTraje).toBeTrue();
        expect(cfg.showPix).toBeTrue();
        expect(cfg.showWhatsAppConfirm).toBeTrue();
        expect(cfg.label).toBe('Casamento');
    });

    it('aniversario não deve exibir traje nem PIX', () => {
        const cfg = service.getConfig('aniversario');
        expect(cfg.showTraje).toBeFalse();
        expect(cfg.showPix).toBeFalse();
        expect(cfg.showWhatsAppConfirm).toBeTrue();
        expect(cfg.label).toBe('Aniversário');
    });

    it('corporativo não deve exibir confirmação WhatsApp', () => {
        const cfg = service.getConfig('corporativo');
        expect(cfg.showWhatsAppConfirm).toBeFalse();
    });

    it('formatura deve exibir traje mas não PIX', () => {
        const cfg = service.getConfig('formatura');
        expect(cfg.showTraje).toBeTrue();
        expect(cfg.showPix).toBeFalse();
    });

    it('todos os tipos devem ter configuração definida', () => {
        for (const tipo of EVENT_TYPES) {
            const cfg = service.getConfig(tipo);
            expect(cfg).toBeTruthy();
            expect(cfg.label).toBeTruthy();
            expect(cfg.roleName).toBeTruthy();
        }
    });
});
