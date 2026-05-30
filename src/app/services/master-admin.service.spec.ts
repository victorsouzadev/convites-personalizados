import { TestBed } from '@angular/core/testing';
import { MasterAdminService } from './master-admin.service';
import { SupabaseService } from './supabase.service';

describe('MasterAdminService', () => {
    let service: MasterAdminService;
    let sbSpy: jasmine.SpyObj<SupabaseService>;

    const fakeClient = {
        from: jasmine.createSpy('from').and.callFake((table: string) => ({
            select: () => ({
                order: () => Promise.resolve({ data: [
                    { slug: 'ev-a', tipo: 'casamento', rotulo_personalizado: null, data_casamento: '2026-08-15T19:00:00' },
                    { slug: 'ev-b', tipo: 'aniversario', rotulo_personalizado: null, data_casamento: '2026-07-10T20:00:00' },
                ], error: null }),
            }),
            delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
            insert: () => Promise.resolve({ error: null }),
        })),
    };

    beforeEach(() => {
        sbSpy = jasmine.createSpyObj('SupabaseService', [], { client: fakeClient });

        TestBed.configureTestingModule({
            providers: [
                MasterAdminService,
                { provide: SupabaseService, useValue: sbSpy },
            ],
        });
        service = TestBed.inject(MasterAdminService);
    });

    it('listEvents deve retornar eventos com guest_count', async () => {
        // Override select para guests count
        fakeClient.from.and.callFake((table: string) => {
            if (table === 'convites') {
                return {
                    select: () => ({ order: () => Promise.resolve({ data: [
                        { slug: 'ev-a', tipo: 'casamento', rotulo_personalizado: null, data_casamento: '2026-08-15T19:00:00' },
                    ], error: null }) }),
                };
            }
            // guests count
            return { select: () => ({ count: 'exact', head: true, eq: () => Promise.resolve({ count: 10, error: null }) }) };
        });

        const events = await service.listEvents();
        expect(events.length).toBeGreaterThan(0);
    });

    it('deleteEvent deve remover guests e convite', async () => {
        const deleteSpy = jasmine.createSpy().and.returnValue({ eq: () => Promise.resolve({ error: null }) });
        fakeClient.from.and.callFake(() => ({ delete: deleteSpy }));

        await service.deleteEvent('ev-a');
        expect(deleteSpy).toHaveBeenCalledTimes(2);
    });
});
