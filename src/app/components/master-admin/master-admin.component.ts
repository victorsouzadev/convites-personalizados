import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MasterAdminService, EventSummary, CreateEventData } from '../../services/master-admin.service';
import { MasterAuthService } from '../../services/master-auth.service';
import { EventTypeService } from '../../services/event-type.service';
import { EVENT_TYPES, EventType } from '../../models/event-type.model';

@Component({
    selector: 'app-master-admin',
    standalone: true,
    imports: [CommonModule, FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="min-h-screen bg-gray-50 p-4">
            <div class="max-w-4xl mx-auto">
                <header class="flex items-center justify-between mb-8">
                    <h1 class="text-2xl font-semibold text-gray-800">Painel Master</h1>
                    <button (click)="logout()" class="text-sm text-gray-500 hover:text-gray-800">Sair</button>
                </header>

                <!-- Criar evento -->
                <section class="bg-white rounded-2xl shadow p-6 mb-8">
                    <h2 class="text-lg font-medium text-gray-700 mb-4">Criar novo evento</h2>
                    <form (ngSubmit)="createEvent()" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">Slug (URL)</label>
                            <input type="text" [(ngModel)]="newEvent.slug" name="slug"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                placeholder="ex: joao-maria-2026" required />
                        </div>
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">Tipo de evento</label>
                            <select [(ngModel)]="newEvent.tipo" name="tipo"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                @for (t of eventTypes; track t) {
                                    <option [value]="t">{{ eventTypeService.getConfig(t).label }}</option>
                                }
                            </select>
                        </div>
                        @if (newEvent.tipo === 'outro') {
                            <div class="sm:col-span-2">
                                <label class="block text-sm text-gray-600 mb-1">Rótulo personalizado</label>
                                <input type="text" [(ngModel)]="newEvent.rotulo_personalizado" name="rotulo"
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    placeholder="ex: Batizado, Chá de Bebê..." />
                            </div>
                        }
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">Data do evento</label>
                            <input type="datetime-local" [(ngModel)]="newEvent.data_casamento" name="data"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                        </div>
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">Local</label>
                            <input type="text" [(ngModel)]="newEvent.local_nome" name="local"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                placeholder="Nome do local" required />
                        </div>
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">Senha do Event Owner</label>
                            <input type="password" [(ngModel)]="newEvent.admin_senha" name="senha"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                placeholder="Senha para o dono do evento" required />
                        </div>
                        @if (createError) {
                            <p class="sm:col-span-2 text-red-500 text-sm">{{ createError }}</p>
                        }
                        <div class="sm:col-span-2">
                            <button type="submit" [disabled]="creating"
                                class="bg-gray-800 text-white px-6 py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50">
                                {{ creating ? 'Criando...' : 'Criar evento' }}
                            </button>
                        </div>
                    </form>
                </section>

                <!-- Lista de eventos -->
                <section class="bg-white rounded-2xl shadow p-6">
                    <h2 class="text-lg font-medium text-gray-700 mb-4">Eventos cadastrados</h2>
                    @if (loading) {
                        <p class="text-gray-500 text-sm">Carregando...</p>
                    } @else if (events.length === 0) {
                        <p class="text-gray-400 text-sm">Nenhum evento cadastrado.</p>
                    } @else {
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm text-left">
                                <thead class="border-b text-gray-500">
                                    <tr>
                                        <th class="pb-2 pr-4">Slug</th>
                                        <th class="pb-2 pr-4">Tipo</th>
                                        <th class="pb-2 pr-4">Data</th>
                                        <th class="pb-2 pr-4">Convidados</th>
                                        <th class="pb-2">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (ev of events; track ev.slug) {
                                        <tr class="border-b last:border-0">
                                            <td class="py-2 pr-4 font-mono text-xs">{{ ev.slug }}</td>
                                            <td class="py-2 pr-4">{{ eventTypeService.getConfig(ev.tipo).label }}</td>
                                            <td class="py-2 pr-4">{{ ev.data_casamento | date:'dd/MM/yyyy' }}</td>
                                            <td class="py-2 pr-4">{{ ev.guest_count }}</td>
                                            <td class="py-2 flex gap-2">
                                                <button (click)="accessAdmin(ev.slug)"
                                                    class="text-xs text-blue-600 hover:underline">Admin</button>
                                                <button (click)="confirmDelete(ev.slug)"
                                                    class="text-xs text-red-500 hover:underline">Excluir</button>
                                            </td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    }
                </section>
            </div>
        </div>
    `,
})
export class MasterAdminComponent implements OnInit {
    events: EventSummary[] = [];
    loading = false;
    creating = false;
    createError = '';
    readonly eventTypes: EventType[] = EVENT_TYPES;

    newEvent: CreateEventData = {
        slug: '',
        tipo: 'casamento',
        admin_senha: '',
        data_casamento: '',
        local_nome: '',
        rotulo_personalizado: '',
    };

    constructor(
        public eventTypeService: EventTypeService,
        private masterAdmin: MasterAdminService,
        private masterAuth: MasterAuthService,
        private router: Router,
        private cdr: ChangeDetectorRef,
    ) {}

    async ngOnInit(): Promise<void> {
        this.loading = true;
        this.cdr.markForCheck();
        this.events = await this.masterAdmin.listEvents();
        this.loading = false;
        this.cdr.markForCheck();
    }

    async createEvent(): Promise<void> {
        this.createError = '';
        if (!this.newEvent.slug.trim()) {
            this.createError = 'O slug é obrigatório.';
            this.cdr.markForCheck();
            return;
        }
        if (!this.newEvent.admin_senha.trim()) {
            this.createError = 'A senha do event owner é obrigatória.';
            this.cdr.markForCheck();
            return;
        }

        this.creating = true;
        this.cdr.markForCheck();

        try {
            await this.masterAdmin.createEvent(this.newEvent);
            this.newEvent = { slug: '', tipo: 'casamento', admin_senha: '', data_casamento: '', local_nome: '', rotulo_personalizado: '' };
            this.events = await this.masterAdmin.listEvents();
        } catch (err) {
            this.createError = err instanceof Error ? err.message : 'Erro ao criar evento.';
        } finally {
            this.creating = false;
            this.cdr.markForCheck();
        }
    }

    async confirmDelete(slug: string): Promise<void> {
        if (!confirm(`Excluir o evento "${slug}" e todos os seus convidados? Esta ação não pode ser desfeita.`)) return;
        await this.masterAdmin.deleteEvent(slug);
        this.events = await this.masterAdmin.listEvents();
        this.cdr.markForCheck();
    }

    accessAdmin(slug: string): void {
        this.router.navigate([`/${slug}/admin`]);
    }

    logout(): void {
        this.masterAuth.logout();
        this.router.navigate(['/master/login']);
    }
}
